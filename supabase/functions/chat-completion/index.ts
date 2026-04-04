
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LOVABLE_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GROQ_MODEL_FC = 'qwen/qwen3-32b'; // function calling + reasoning

interface Provider {
  name: string; url: string; apiKey: string; model: string; type: 'groq'|'gemini'|'lovable';
}

function getProviders(): Provider[] {
  const env = Deno.env.toObject();
  const p: Provider[] = [];
  const gk = [env.GROQ_API, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3].filter(Boolean);
  gk.forEach((k, i) => p.push({ name: `groq_${i+1}`, url: GROQ_URL, apiKey: k, model: GROQ_MODEL_FC, type: 'groq' }));
  for (const ek in env) if (ek.startsWith('GOOGLE_API_KEY')) p.push({ name: `gemini_${ek}`, url: GEMINI_URL, apiKey: env[ek], model: 'gemini-2.5-flash', type: 'gemini' });
  if (env.LOVABLE_API_KEY) p.push({ name: 'lovable', url: LOVABLE_URL, apiKey: env.LOVABLE_API_KEY, model: 'google/gemini-3-flash-preview', type: 'lovable' });
  return p;
}

// Tool definitions
const TOOLS = [
  {
    type: 'function', function: {
      name: 'web_search',
      description: 'Search the internet for latest/real-time information. Use for: current events, today\'s news, live scores, weather, stock prices, recent happenings, anything after your training cutoff, or when user asks about "aaj", "today", "latest", "current", "abhi", "now", "2025", "2026".',
      parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query in the language most relevant for results' } }, required: ['query'] }
    }
  },
  {
    type: 'function', function: {
      name: 'fetch_news',
      description: 'Get latest news headlines. Use when user asks for news, khabar, samachar, headlines, or current affairs.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'News topic' },
          category: { type: 'string', description: 'Category: education, technology, business, sports, entertainment, science, health' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'generate_image',
      description: 'Generate image from text. Only when user explicitly asks to create/draw/generate/make an image or picture.',
      parameters: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] }
    }
  }
];

// Execute tools
async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  if (name === 'web_search') {
    const tavilyKeys = [
      Deno.env.get('TAVILY_API_KEY'), Deno.env.get('TAVILY_API_KEY_1'),
      Deno.env.get('TAVILY_API_KEY_2'), Deno.env.get('TAVILY_API_KEY_3')
    ].filter(Boolean);
    for (const key of tavilyKeys) {
      try {
        const r = await fetch('https://api.tavily.com/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key, query: args.query, max_results: 5, search_depth: 'basic', include_answer: true }),
        });
        if (!r.ok) continue;
        const d = await r.json();
        let out = '';
        if (d.answer) out += `Summary: ${d.answer}\n\n`;
        out += (d.results || []).map((x: any) => `[${x.title}](${x.url}): ${x.content?.slice(0,250)}`).join('\n\n');
        return out || 'No results found';
      } catch { continue; }
    }
    return 'Web search temporarily unavailable. Please provide answer from your knowledge.';
  }
  if (name === 'fetch_news') {
    try {
      // Use Tavily for news too since NewsAPI may not be configured
      const tavilyKey = Deno.env.get('TAVILY_API_KEY') || Deno.env.get('TAVILY_API_KEY_1');
      if (!tavilyKey) return 'News service not available';
      const q = (args.query || args.category || 'India') + ' latest news today';
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, query: q, max_results: 6, search_depth: 'basic', topic: 'news' }),
      });
      if (!r.ok) return 'News fetch failed';
      const d = await r.json();
      return (d.results || []).map((x: any, i: number) => `${i+1}. **${x.title}**\n${x.content?.slice(0,200)}\n🔗 ${x.url}`).join('\n\n') || 'No news found';
    } catch { return 'News service unavailable'; }
  }
  if (name === 'generate_image') {
    return `[Image generation requested: "${args.prompt}"] — Image generation will be handled client-side.`;
  }
  return 'Unknown tool';
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Get current IST time string
function getISTTimeString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const days = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
  const months = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]} ${ist.getUTCFullYear()}, ${ist.getUTCHours()}:${String(ist.getUTCMinutes()).padStart(2,'0')} IST`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { prompt, history = [], imageBase64, reasoningMode = false, userContext, mindVaultContext, groupId } = await req.json();
    if (!prompt && !imageBase64) return new Response(JSON.stringify({ error: 'No prompt' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // Fetch mind vault if not pre-fetched
    let memoriesCtx = mindVaultContext || '';
    let groupPromptCtx = '';
    try {
      const sbUrl = Deno.env.get('SUPABASE_URL')!;
      const sbKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
      const uc = createClient(sbUrl, sbKey, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
      const { data: { user } } = await uc.auth.getUser();
      if (user && !memoriesCtx) {
        const { data: mems } = await uc.from('user_memories').select('memory_key,memory_value').eq('user_id', user.id).order('importance', { ascending: false }).limit(15);
        if (mems?.length) memoriesCtx = `\n🧠 Mind Vault:\n${mems.map((m: any) => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
      }

      // Group context
      if (user && groupId) {
        const { data: groupData } = await uc.from('study_groups').select('group_system_prompt').eq('id', groupId).maybeSingle();
        const { data: participants } = await uc.from('group_participants').select('user_id').eq('group_id', groupId).eq('is_active', true);
        const memberIds = participants?.map((p: any) => p.user_id) || [];
        if (memberIds.length) {
          const { data: groupMems } = await uc.from('user_memories').select('user_id,memory_key,memory_value,importance').in('user_id', memberIds).order('importance', { ascending: false }).limit(100);
          if (groupMems?.length) {
            const byUser: Record<string, string[]> = {};
            for (const mem of groupMems) {
              if (!byUser[mem.user_id]) byUser[mem.user_id] = [];
              if (byUser[mem.user_id].length < 10) byUser[mem.user_id].push(`- ${mem.memory_key}: ${mem.memory_value}`);
            }
            groupPromptCtx = `\n\n👥 Group Members' Mind Vault:\n${Object.entries(byUser).map(([uid, memories]) => `Student ${uid.slice(0,8)}:\n${memories.join('\n')}`).join('\n\n')}`;
          }
        }
        if (groupData?.group_system_prompt) groupPromptCtx = `\n\n📋 Group Instructions: ${groupData.group_system_prompt}${groupPromptCtx}`;
      }
    } catch (e) { console.warn('Context fetch err:', e); }

    const currentTime = getISTTimeString();
    
    let systemPrompt = `You are 'Study AI' (स्टडी AI), created by Ajit Kumar. You are a friendly mentor who speaks in simple Hindi-English (Hinglish).

📅 CURRENT DATE & TIME: ${currentTime}
📅 ISO Date: ${new Date().toISOString().slice(0, 10)}

⚠️ CRITICAL TOOL USAGE RULES:
1. Your training data is LIMITED. For ANY question about events, news, scores, prices, weather, or facts from 2025 onwards, you MUST call web_search first.
2. If user asks "aaj kya hua", "today's news", "latest", "current", "abhi", or anything time-sensitive → ALWAYS use web_search or fetch_news tool FIRST.
3. If user asks about any person, place, or event and you're not 100% sure your info is current → use web_search.
4. You can call MULTIPLE tools in PARALLEL when needed (e.g., web_search + fetch_news simultaneously).
5. After getting tool results, synthesize them into a clear, helpful response in Hinglish.
6. NEVER say "I don't have latest info" without first trying web_search.

🧠 Personality: Supportive, encouraging, uses emojis naturally. Explain complex topics simply. If student struggles, break it down step-by-step.
${memoriesCtx}${groupPromptCtx}`;

    if (userContext) systemPrompt += `\n\n📋 Recent conversation context:\n${userContext}`;
    if (reasoningMode) systemPrompt += `\n\n📐 REASONING MODE ACTIVE: Solve step-by-step with detailed mathematical/logical working. Show your thought process clearly.`;

    const mappedHistory = history.map((m: any) => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content }));
    const userContent: any = imageBase64
      ? [{ type: 'text', text: prompt || 'इस image को analyze करो' }, { type: 'image_url', image_url: { url: imageBase64 } }]
      : prompt;

    const messages = [{ role: 'system', content: systemPrompt }, ...mappedHistory.slice(-30), { role: 'user', content: userContent }];
    const providers = getProviders();
    if (!providers.length) return new Response(JSON.stringify({ error: 'No AI providers configured' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const write = (s: string) => writer.write(encoder.encode(s));

    (async () => {
      try {
        await write(sseEvent('status', { status: 'thinking', text: '🧠 Analyzing your question...' }));

        let providerResponse: Response | null = null;
        let usedProvider: Provider | null = null;

        for (const provider of providers) {
          try {
            await write(sseEvent('status', { status: 'connecting', text: `⚡ ${provider.type === 'groq' ? 'Ultra-fast Qwen' : provider.type === 'gemini' ? 'Gemini' : 'Lovable AI'} connecting...` }));

            const body: any = {
              model: provider.model,
              messages,
              temperature: reasoningMode ? 0.5 : 0.7,
              max_tokens: 8192,
              stream: true,
            };

            // Add tools for all providers (not just Groq) when no image
            if (!imageBase64) {
              body.tools = TOOLS;
              body.tool_choice = 'auto';
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (provider.type === 'gemini') {
              headers['X-goog-api-key'] = provider.apiKey;
            } else {
              headers['Authorization'] = `Bearer ${provider.apiKey}`;
            }

            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 20000);
            const resp = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
            clearTimeout(tid);

            if (!resp.ok) {
              const et = await resp.text().catch(() => '');
              console.warn(`${provider.name} HTTP ${resp.status}: ${et.slice(0,200)}`);
              continue;
            }
            providerResponse = resp;
            usedProvider = provider;
            break;
          } catch (e: unknown) {
            console.warn(`⚠️ ${provider.name} failed:`, (e as Error)?.message);
            continue;
          }
        }

        if (!providerResponse?.body || !usedProvider) {
          await write(sseEvent('error', { error: 'All AI providers failed. Please try again.' }));
          await write('data: [DONE]\n\n');
          await writer.close();
          return;
        }

        await write(sseEvent('status', { status: 'generating', text: '✨ Preparing your answer...', provider: usedProvider.name }));

        // Parse SSE stream
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
            if (json === '[DONE]') continue;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              if (delta.content) {
                // Filter out <think> blocks from Qwen
                const cleaned = delta.content.replace(/<think>[\s\S]*?<\/think>/g, '');
                if (cleaned) {
                  fullContent += cleaned;
                  await write(sseEvent('token', { content: cleaned }));
                }
              }

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id || `call_${idx}`, name: '', arguments: '' };
                  if (tc.id) toolCalls[idx].id = tc.id;
                  if (tc.function?.name) toolCalls[idx].name += tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
                }
              }
            } catch { /* partial JSON */ }
          }
        }

        // Handle leftover <think> content that might be split across chunks
        if (fullContent.includes('<think>')) {
          fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        }

        // Execute tool calls
        if (toolCalls.length > 0 && toolCalls.some(tc => tc.name)) {
          const validCalls = toolCalls.filter(tc => tc.name);
          
          for (const tc of validCalls) {
            const statusTexts: Record<string, string> = {
              web_search: '🔍 Internet पर latest जानकारी खोज रहा हूँ...',
              fetch_news: '📰 ताज़ा खबरें निकाल रहा हूँ...',
              generate_image: '🎨 Image बना रहा हूँ...',
            };
            await write(sseEvent('status', { status: 'tool_executing', text: statusTexts[tc.name] || '🔧 Tool चला रहा हूँ...', tool: tc.name }));
          }

          // Execute all tools in parallel
          const toolResults = await Promise.all(validCalls.map(async (tc) => {
            let args: Record<string, string> = {};
            try { args = JSON.parse(tc.arguments); } catch {}
            const result = await executeTool(tc.name, args);
            return { id: tc.id, name: tc.name, result };
          }));

          await write(sseEvent('status', { status: 'processing_results', text: '📊 Results मिल गए, जवाब बना रहा हूँ...' }));

          // Second call with tool results
          const toolMessages = [
            ...messages,
            { role: 'assistant', content: fullContent || null, tool_calls: validCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.arguments } })) },
            ...toolResults.map(tr => ({ role: 'tool', tool_call_id: tr.id, content: tr.result }))
          ];

          // Try providers for follow-up
          for (const provider of providers) {
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (provider.type === 'gemini') headers['X-goog-api-key'] = provider.apiKey;
              else headers['Authorization'] = `Bearer ${provider.apiKey}`;

              const body2: any = { model: provider.model, messages: toolMessages, temperature: 0.7, max_tokens: 8192, stream: true };
              const ctrl2 = new AbortController();
              const tid2 = setTimeout(() => ctrl2.abort(), 20000);
              const resp2 = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body2), signal: ctrl2.signal });
              clearTimeout(tid2);
              if (!resp2.ok || !resp2.body) continue;

              await write(sseEvent('status', { status: 'generating', text: '✨ Final answer तैयार कर रहा हूँ...' }));

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
                  if (j2 === '[DONE]') continue;
                  try {
                    const p2 = JSON.parse(j2);
                    const c2 = p2.choices?.[0]?.delta?.content;
                    if (c2) {
                      const cleaned2 = c2.replace(/<think>[\s\S]*?<\/think>/g, '');
                      if (cleaned2) await write(sseEvent('token', { content: cleaned2 }));
                    }
                  } catch {}
                }
              }
              break;
            } catch { continue; }
          }

          // Send tool usage info
          await write(sseEvent('tools_used', {
            tools: toolResults.map(t => {
              let parsedArgs: any = {};
              try { parsedArgs = JSON.parse(validCalls.find(c => c.id === t.id)?.arguments || '{}'); } catch {}
              return { name: t.name, query: parsedArgs.query || parsedArgs.topic || '' };
            })
          }));
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
