
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LOVABLE_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GROQ_MODEL = 'qwen/qwen3-32b';
const GEMINI_MODEL = 'gemini-2.5-flash';

interface Provider {
  name: string; url: string; apiKey: string; model: string; type: 'groq'|'gemini'|'lovable';
}

function getProviders(): Provider[] {
  const env = Deno.env.toObject();
  const p: Provider[] = [];
  // Groq first (strict failover order)
  const groqKeys = [
    { key: env.GROQ_API_KEY_1, name: 'groq_key_1' },
    { key: env.GROQ_API_KEY_2, name: 'groq_key_2' },
    { key: env.GROQ_API_KEY_3, name: 'groq_key_3' },
    // Backward-compatible fallback if legacy key is still configured
    { key: env.GROQ_API, name: 'groq_legacy' },
  ];
  groqKeys
    .filter((entry) => Boolean(entry.key))
    .forEach((entry) => p.push({ name: entry.name, url: GROQ_URL, apiKey: entry.key!, model: GROQ_MODEL, type: 'groq' }));
  // Gemini
  for (const ek in env) if (ek.startsWith('GOOGLE_API_KEY')) p.push({ name: `gemini_${ek}`, url: GEMINI_URL, apiKey: env[ek], model: GEMINI_MODEL, type: 'gemini' });
  // Lovable
  if (env.LOVABLE_API_KEY) p.push({ name: 'lovable', url: LOVABLE_URL, apiKey: env.LOVABLE_API_KEY, model: 'google/gemini-3-flash-preview', type: 'lovable' });
  return p;
}

// Tool definitions for Qwen agent
const TOOLS = [
  {
    type: 'function', function: {
      name: 'web_search',
      description: 'Search internet for latest info, news, live scores, weather, prices, current events. Use when query needs up-to-date real-time data.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
    }
  },
  {
    type: 'function', function: {
      name: 'generate_image',
      description: 'Generate image from text description. Only when user explicitly asks to create/draw/generate an image.',
      parameters: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] }
    }
  }
];

// Execute tool calls
async function executeTool(name: string, args: any): Promise<string> {
  if (name === 'web_search') {
    const tavilyKeys = [
      Deno.env.get('TAVILY_API_KEY'), Deno.env.get('TAVILY_API_KEY_1'),
      Deno.env.get('TAVILY_API_KEY_2'), Deno.env.get('TAVILY_API_KEY_3')
    ].filter(Boolean);
    for (const key of tavilyKeys) {
      try {
        const r = await fetch('https://api.tavily.com/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key, query: args.query, max_results: 5, search_depth: 'basic' }),
        });
        if (!r.ok) continue;
        const d = await r.json();
        return d.results?.map((x: any) => `[${x.title}](${x.url}): ${x.content?.slice(0,200)}`).join('\n\n') || 'No results found';
      } catch { continue; }
    }
    return 'Web search unavailable';
  }
  if (name === 'generate_image') {
    return `[Image generation requested: "${args.prompt}"] — Image generation will be handled client-side.`;
  }
  return 'Unknown tool';
}

// SSE helper
function sseEvent(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { prompt, history = [], imageBase64, reasoningMode = false, userContext, mindVaultContext } = await req.json();
    if (!prompt && !imageBase64) return new Response(JSON.stringify({ error: 'No prompt' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // Auth & memories (only if not pre-fetched)
    let memoriesCtx = mindVaultContext || '';
    if (!memoriesCtx) {
      try {
        const sbUrl = Deno.env.get('SUPABASE_URL')!;
        const sbKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const uc = createClient(sbUrl, sbKey, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
        const { data: { user } } = await uc.auth.getUser();
        if (user) {
          const { data: mems } = await uc.from('user_memories').select('memory_key,memory_value').eq('user_id', user.id).order('importance', { ascending: false }).limit(15);
          if (mems?.length) memoriesCtx = `\n🧠 Mind Vault:\n${mems.map((m: any) => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
        }
      } catch (e) { console.warn('Mem fetch err:', e); }
    }

    let systemPrompt = `आप 'Study AI' हैं, जिसे अजित कुमार ने बनाया है। आप एक दोस्त और मेंटोर हैं। सरल Hindi-English भाषा में बात करें।${memoriesCtx}`;
    if (userContext) systemPrompt += `\n\n📋 Recent context:\n${userContext}`;
    if (reasoningMode) systemPrompt += `\n\n📐 Reasoning Mode ON: Step-by-step solve करो, mathematical/logical problems detail में।`;

    const mappedHistory = history.map((m: any) => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content }));
    const userContent: any = imageBase64
      ? [{ type: 'text', text: prompt || 'Image analyze करो' }, { type: 'image_url', image_url: { url: imageBase64 } }]
      : prompt;

    const messages = [{ role: 'system', content: systemPrompt }, ...mappedHistory.slice(-30), { role: 'user', content: userContent }];

    const providers = getProviders();
    if (!providers.length) return new Response(JSON.stringify({ error: 'No providers' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // Create SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const write = (s: string) => writer.write(encoder.encode(s));

    // Process in background
    (async () => {
      try {
        await write(sseEvent('status', { status: 'thinking', text: '🧠 Thinking...' }));

        // Try providers sequentially
        let providerResponse: Response | null = null;
        let usedProvider = '';

        for (const provider of providers) {
          try {
            await write(sseEvent('status', { status: 'connecting', text: `⚡ Connecting ${provider.type === 'groq' ? 'Groq' : provider.type} engine...` }));

            const body: any = {
              model: provider.model, messages,
              temperature: reasoningMode ? 0.6 : 0.7,
              max_tokens: 8192, stream: true,
            };

            // Add tools for function calling
            if (TOOLS.length > 0 && !imageBase64) {
              body.tools = TOOLS;
              body.tool_choice = 'auto';
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (provider.type === 'gemini') headers['X-goog-api-key'] = provider.apiKey;
            else headers['Authorization'] = `Bearer ${provider.apiKey}`;

            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 15000);
            const resp = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
            clearTimeout(tid);

            if (!resp.ok) {
              const et = await resp.text().catch(() => '');
              throw new Error(`${resp.status}: ${et.slice(0,200)}`);
            }
            providerResponse = resp;
            usedProvider = provider.name;
            break;
          } catch (e: any) {
            console.warn(`⚠️ ${provider.name} failed:`, e?.message);
            continue;
          }
        }

        if (!providerResponse?.body) {
          await write(sseEvent('error', { error: 'All AI providers failed' }));
          await write('data: [DONE]\n\n');
          await writer.close();
          return;
        }

        await write(sseEvent('status', { status: 'generating', text: '✨ Preparing response...', provider: usedProvider }));

        // Parse the provider's SSE stream and forward tokens + handle tool calls
        const reader = providerResponse.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let toolCalls: any[] = [];
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              // Token content
              if (delta.content) {
                fullContent += delta.content;
                await write(sseEvent('token', { content: delta.content }));
              }

              // Tool call accumulation
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id, name: '', arguments: '' };
                  if (tc.id) toolCalls[idx].id = tc.id;
                  if (tc.function?.name) toolCalls[idx].name += tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
                }
              }
            } catch { /* partial */ }
          }
        }

        // Execute tool calls if any
        if (toolCalls.length > 0 && toolCalls.some(tc => tc.name)) {
          const validCalls = toolCalls.filter(tc => tc.name);
          
          // Send real status about what tools are being used
          for (const tc of validCalls) {
            const toolName = tc.name;
            let statusText = '🔧 Tool चला रहा हूँ...';
            if (toolName === 'web_search') statusText = '🔍 इंटरनेट पर खोज रहा हूँ...';
            else if (toolName === 'generate_image') statusText = '🎨 Image बना रहा हूँ...';
            await write(sseEvent('status', { status: 'tool_executing', text: statusText, tool: toolName }));
          }

          // Execute all tools in parallel
          const toolResults = await Promise.all(validCalls.map(async (tc) => {
            let args = {};
            try { args = JSON.parse(tc.arguments); } catch {}
            const result = await executeTool(tc.name, args);
            return { id: tc.id, name: tc.name, result };
          }));

          await write(sseEvent('status', { status: 'processing_results', text: '📊 जानकारी मिल गई, जवाब बना रहा हूँ...' }));

          // Second call with tool results
          const toolMessages = [
            ...messages,
            { role: 'assistant', content: fullContent || null, tool_calls: validCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.arguments } })) },
            ...toolResults.map(tr => ({ role: 'tool', tool_call_id: tr.id, content: tr.result }))
          ];

          // Try providers again for the follow-up
          for (const provider of providers) {
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (provider.type === 'gemini') headers['X-goog-api-key'] = provider.apiKey;
              else headers['Authorization'] = `Bearer ${provider.apiKey}`;

              const body2: any = { model: provider.model, messages: toolMessages, temperature: 0.7, max_tokens: 8192, stream: true };
              const ctrl2 = new AbortController();
              const tid2 = setTimeout(() => ctrl2.abort(), 15000);
              const resp2 = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body2), signal: ctrl2.signal });
              clearTimeout(tid2);
              if (!resp2.ok || !resp2.body) continue;

              const reader2 = resp2.body.getReader();
              let buf2 = '';
              while (true) {
                const { done: d2, value: v2 } = await reader2.read();
                if (d2) break;
                buf2 += decoder.decode(v2, { stream: true });
                let nl2: number;
                while ((nl2 = buf2.indexOf('\n')) !== -1) {
                  let line2 = buf2.slice(0, nl2);
                  buf2 = buf2.slice(nl2 + 1);
                  if (line2.endsWith('\r')) line2 = line2.slice(0, -1);
                  if (!line2.startsWith('data: ')) continue;
                  const j2 = line2.slice(6).trim();
                  if (j2 === '[DONE]') break;
                  try {
                    const p2 = JSON.parse(j2);
                    const c2 = p2.choices?.[0]?.delta?.content;
                    if (c2) await write(sseEvent('token', { content: c2 }));
                  } catch {}
                }
              }
              break;
            } catch { continue; }
          }

          // Send tool info for UI
          await write(sseEvent('tools_used', { tools: toolResults.map(t => ({ name: t.name, query: t.name === 'web_search' ? JSON.parse(validCalls.find(c => c.id === t.id)?.arguments || '{}').query : '' })) }));
        }

        await write(sseEvent('status', { status: 'done', text: '✅ Complete' }));
        await write('data: [DONE]\n\n');
      } catch (e) {
        console.error('Stream error:', e);
        try { await write(sseEvent('error', { error: 'Processing failed' })); } catch {}
      } finally {
        try { await writer.close(); } catch {}
      }
    })();

    return new Response(readable, {
      headers: { ...CORS, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch (e: unknown) {
    console.error('Fatal:', e);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
