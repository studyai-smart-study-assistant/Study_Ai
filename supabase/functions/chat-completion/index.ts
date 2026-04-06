
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

const GROQ_MODEL_TEXT = 'qwen/qwen3-32b';
const GROQ_MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Round-robin state persists within isolate
let groqKeyCounter = 0;

type TavilyResult = { title?: string; url?: string; content?: string };
type TavilyResponse = { answer?: string; results?: TavilyResult[] };
type ChatHistoryItem = { role: string; content: unknown };
type ToolCallDelta = { index?: number; id?: string; function?: { name?: string; arguments?: string } };
type ParsedSSEDelta = { content?: string; tool_calls?: ToolCallDelta[] };
type ParsedSSEChunk = { choices?: Array<{ delta?: ParsedSSEDelta }> };
type AccumulatedToolCall = { id: string; name: string; arguments: string };
type ToolUsageArgs = { query?: string; topic?: string };

interface ProviderEntry {
  name: string; url: string; apiKey: string; model: string;
  type: 'groq' | 'gemini' | 'lovable'; keySlot: number | null;
}

function getOrderedProviders(hasImage: boolean): ProviderEntry[] {
  const env = Deno.env.toObject();
  const providers: ProviderEntry[] = [];

  // GROQ TIER - round-robin start
  const groqKeys = [env.GROQ_API, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3].filter(Boolean) as string[];
  if (groqKeys.length > 0) {
    const startIdx = groqKeyCounter % groqKeys.length;
    groqKeyCounter++;
    const model = hasImage ? GROQ_MODEL_VISION : GROQ_MODEL_TEXT;
    for (let i = 0; i < groqKeys.length; i++) {
      const keyIdx = (startIdx + i) % groqKeys.length;
      providers.push({ name: `groq_key_${keyIdx + 1}`, url: GROQ_URL, apiKey: groqKeys[keyIdx], model, type: 'groq', keySlot: keyIdx + 1 });
    }
  }

  // GEMINI TIER - use Bearer auth with OpenAI-compat endpoint
  const geminiKeyNames = Object.keys(env).filter(k => k.startsWith('GOOGLE_API_KEY')).sort();
  for (const ek of geminiKeyNames) {
    if (env[ek]) {
      providers.push({ name: `gemini_${ek}`, url: GEMINI_URL, apiKey: env[ek], model: 'gemini-2.5-flash', type: 'gemini', keySlot: null });
    }
  }

  // LOVABLE TIER
  if (env.LOVABLE_API_KEY) {
    providers.push({ name: 'lovable', url: LOVABLE_URL, apiKey: env.LOVABLE_API_KEY, model: 'google/gemini-3-flash-preview', type: 'lovable', keySlot: null });
  }

  return providers;
}

const TOOLS = [
  {
    type: 'function', function: {
      name: 'web_search',
      description: 'Search internet for real-time info: news, scores, weather, prices, events from 2025+, or when user says "aaj/today/latest/current/abhi/now".',
      parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] }
    }
  },
  {
    type: 'function', function: {
      name: 'fetch_news',
      description: 'Get latest news headlines when user asks for news/khabar/samachar/headlines.',
      parameters: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'send_push_notification',
      description: 'Send push notification for reminders/goals.',
      parameters: { type: 'object', properties: { user_id: { type: 'string' }, title: { type: 'string' }, message: { type: 'string' }, scheduled_time: { type: 'string' }, recurrence: { type: 'string' }, schedule_count: { type: 'number' } }, required: ['user_id', 'title', 'message'] }
    }
  },
  {
    type: 'function', function: {
      name: 'generate_image',
      description: 'Generate image only when user explicitly asks to create/draw/generate an image.',
      parameters: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] }
    }
  }
];

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  if (name === 'web_search') {
    const tavilyKeys = [Deno.env.get('TAVILY_API_KEY'), Deno.env.get('TAVILY_API_KEY_1'), Deno.env.get('TAVILY_API_KEY_2'), Deno.env.get('TAVILY_API_KEY_3')].filter(Boolean);
    for (const key of tavilyKeys) {
      try {
        const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: key, query: args.query, max_results: 5, search_depth: 'basic', include_answer: true }) });
        if (!r.ok) continue;
        const d = await r.json() as TavilyResponse;
        let out = '';
        if (d.answer) out += `Summary: ${d.answer}\n\n`;
        out += (d.results || []).map(x => `[${x.title}](${x.url}): ${x.content?.slice(0, 250)}`).join('\n\n');
        return out || 'No results found';
      } catch { continue; }
    }
    return 'Web search temporarily unavailable.';
  }
  if (name === 'fetch_news') {
    const tavilyKey = Deno.env.get('TAVILY_API_KEY') || Deno.env.get('TAVILY_API_KEY_1');
    if (!tavilyKey) return 'News service not available';
    try {
      const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: tavilyKey, query: (args.query || args.category || 'India') + ' latest news today', max_results: 6, search_depth: 'basic', topic: 'news' }) });
      if (!r.ok) return 'News fetch failed';
      const d = await r.json() as TavilyResponse;
      return (d.results || []).map((x, i: number) => `${i + 1}. **${x.title}**\n${x.content?.slice(0, 200)}\n🔗 ${x.url}`).join('\n\n') || 'No news found';
    } catch { return 'News service unavailable'; }
  }
  if (name === 'send_push_notification') {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const restKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!appId || !restKey) return 'Notification service unavailable.';
    const payload: Record<string, unknown> = { app_id: appId, include_aliases: { external_id: [args.user_id] }, target_channel: 'push', headings: { en: args.title, hi: args.title }, contents: { en: args.message, hi: args.message } };
    if (args.scheduled_time) payload.send_after = args.scheduled_time;
    const response = await fetch('https://api.onesignal.com/notifications', { method: 'POST', headers: { Authorization: `Key ${restKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) return `Push failed: ${response.status}`;
    return `Push sent successfully. ID: ${data.id || 'unknown'}`;
  }
  if (name === 'generate_image') return `[Image generation requested: "${args.prompt}"]`;
  return 'Unknown tool';
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function getISTTimeString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]} ${ist.getUTCFullYear()}, ${ist.getUTCHours()}:${String(ist.getUTCMinutes()).padStart(2, '0')} IST`;
}

async function streamProviderResponse(
  providerResp: Response,
  write: (s: string) => Promise<void>,
): Promise<{ fullContent: string; toolCalls: AccumulatedToolCall[] }> {
  const reader = providerResp.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const toolCalls: AccumulatedToolCall[] = [];
  let fullContent = '';

  for (; ;) {
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
        const parsed = JSON.parse(json) as ParsedSSEChunk;
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          const cleaned = delta.content.replace(/<think>[\s\S]*?<\/think>/g, '');
          if (cleaned) { fullContent += cleaned; await write(sseEvent('token', { content: cleaned })); }
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

  if (fullContent.includes('<think>')) fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return { fullContent, toolCalls };
}

/**
 * Build a compact system prompt that fits within Groq's 6000 TPM limit.
 * Full prompt ~800 tokens, leaving room for history + response.
 */
function buildSystemPrompt(
  currentTime: string,
  memoriesCtx: string,
  groupPromptCtx: string,
  userContext: string | undefined,
  reasoningMode: boolean,
): string {
  let sp = `You are Study AI, created by Ajit Kumar. Friendly Hinglish mentor for students.
📅 ${currentTime} | ISO: ${new Date().toISOString().slice(0, 10)}
RULES: For 2025+ events/news/scores → MUST call web_search first. Multiple tools can run in parallel. Never say "I don't have info" without trying web_search. Use Hinglish, emojis, be encouraging.`;

  if (memoriesCtx) sp += `\n${memoriesCtx}`;
  if (groupPromptCtx) sp += groupPromptCtx;
  if (userContext) sp += `\nContext: ${userContext}`;
  if (reasoningMode) sp += `\n📐 REASONING MODE: Show step-by-step working.`;
  return sp;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { prompt, history = [], imageBase64, reasoningMode = false, userContext, mindVaultContext, groupId } = await req.json();
    if (!prompt && !imageBase64) return new Response(JSON.stringify({ error: 'No prompt' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const hasImage = !!imageBase64;

    // Fetch context
    let memoriesCtx = mindVaultContext || '';
    let groupPromptCtx = '';
    try {
      const sbUrl = Deno.env.get('SUPABASE_URL')!;
      const sbKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
      const uc = createClient(sbUrl, sbKey, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
      const { data: { user } } = await uc.auth.getUser();
      if (user && !memoriesCtx) {
        const { data: mems } = await uc.from('user_memories').select('memory_key,memory_value').eq('user_id', user.id).order('importance', { ascending: false }).limit(10);
        if (mems?.length) memoriesCtx = `\n🧠 Mind Vault: ${mems.map(m => `${m.memory_key}=${m.memory_value}`).join('; ')}`;
      }
      if (user && groupId) {
        const { data: groupData } = await uc.from('study_groups').select('group_system_prompt').eq('id', groupId).maybeSingle();
        if (groupData?.group_system_prompt) groupPromptCtx = `\nGroup: ${groupData.group_system_prompt}`;
      }
    } catch (e) { console.warn('Context fetch err:', e); }

    const currentTime = getISTTimeString();
    const systemPrompt = buildSystemPrompt(currentTime, memoriesCtx, groupPromptCtx, userContext, reasoningMode);

    const mappedHistory = (history as ChatHistoryItem[]).map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content }));
    
    // Limit history to last 10 messages to stay within Groq TPM limits
    const trimmedHistory = mappedHistory.slice(-10);

    const userContent = hasImage
      ? [{ type: 'text', text: prompt || 'इस image को analyze करो' }, { type: 'image_url', image_url: { url: imageBase64 } }]
      : prompt;

    const messages = [{ role: 'system', content: systemPrompt }, ...trimmedHistory, { role: 'user', content: userContent }];
    const providers = getOrderedProviders(hasImage);

    if (!providers.length) return new Response(JSON.stringify({ error: 'No AI providers configured' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const write = async (s: string) => { await writer.write(encoder.encode(s)); };

    (async () => {
      try {
        await write(sseEvent('status', { status: 'thinking', text: '🧠 सवाल समझ रहा हूँ...' }));

        let providerResponse: Response | null = null;
        let usedProvider: ProviderEntry | null = null;

        for (const provider of providers) {
          const tierLabel = provider.type === 'groq' ? `Groq Qwen (Key ${provider.keySlot})` : provider.type === 'gemini' ? 'Gemini' : 'Lovable AI';
          console.log(`🔄 TRY_${provider.type.toUpperCase()}_KEY_${provider.keySlot ?? 'N/A'}: ${provider.name}`);

          try {
            await write(sseEvent('status', { status: 'connecting', text: `⚡ ${tierLabel} से connect हो रहा है...`, provider: provider.type, provider_key_slot: provider.keySlot }));

            const body: Record<string, unknown> = {
              model: provider.model,
              messages,
              temperature: reasoningMode ? 0.5 : 0.7,
              max_tokens: provider.type === 'groq' ? 4096 : 8192,
              stream: true,
            };

            if (!hasImage) { body.tools = TOOLS; body.tool_choice = 'auto'; }

            // Auth: ALL providers use Bearer token with OpenAI-compat endpoints
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${provider.apiKey}`,
            };

            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 20000);
            const resp = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
            clearTimeout(tid);

            if (!resp.ok) {
              const et = await resp.text().catch(() => '');
              console.warn(`❌ ${provider.type.toUpperCase()}_FAILED_KEY_${provider.keySlot ?? 'N/A'}: HTTP ${resp.status} - ${et.slice(0, 300)}`);
              continue;
            }

            console.log(`✅ ${provider.type.toUpperCase()}_SUCCESS_KEY_${provider.keySlot ?? 'N/A'}: ${provider.name}`);
            providerResponse = resp;
            usedProvider = provider;
            break;
          } catch (e: unknown) {
            console.warn(`❌ ${provider.type.toUpperCase()}_FAILED_KEY_${provider.keySlot ?? 'N/A'}: ${(e as Error)?.message}`);
            continue;
          }
        }

        if (!providerResponse?.body || !usedProvider) {
          await write(sseEvent('error', { error: 'All AI providers failed. Please try again.' }));
          await write('data: [DONE]\n\n');
          await writer.close();
          return;
        }

        await write(sseEvent('status', {
          status: 'provider_selected',
          text: `✨ ${usedProvider.type === 'groq' ? 'Ultra-fast Qwen' : usedProvider.type === 'gemini' ? 'Gemini' : 'Lovable AI'} जवाब तैयार कर रहा है...`,
          provider: usedProvider.type, provider_used: usedProvider.type,
          provider_key_slot: usedProvider.keySlot ? String(usedProvider.keySlot) : null,
        }));

        const { fullContent, toolCalls } = await streamProviderResponse(providerResponse, write);

        // Execute tool calls
        const validCalls = toolCalls.filter(tc => tc.name);
        if (validCalls.length > 0) {
          for (const tc of validCalls) {
            const statusTexts: Record<string, string> = { web_search: '🔍 Internet पर खोज रहा हूँ...', fetch_news: '📰 ताज़ा खबरें...', generate_image: '🎨 Image बना रहा हूँ...', send_push_notification: '🔔 Reminder भेज रहा हूँ...' };
            await write(sseEvent('status', { status: 'tool_executing', text: statusTexts[tc.name] || '🔧 Tool चला रहा हूँ...', tool: tc.name }));
          }

          const toolResults = await Promise.all(validCalls.map(async tc => {
            let args: Record<string, string> = {};
            try { args = JSON.parse(tc.arguments); } catch { /* */ }
            return { id: tc.id, name: tc.name, result: await executeTool(tc.name, args) };
          }));

          await write(sseEvent('status', { status: 'processing_results', text: '📊 Final जवाब बना रहा हूँ...' }));

          const toolMessages = [
            ...messages,
            { role: 'assistant', content: fullContent || null, tool_calls: validCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.arguments } })) },
            ...toolResults.map(tr => ({ role: 'tool', tool_call_id: tr.id, content: tr.result }))
          ];

          for (const provider of providers) {
            try {
              console.log(`🔄 FOLLOWUP_TRY_${provider.type.toUpperCase()}_KEY_${provider.keySlot ?? 'N/A'}`);
              const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` };
              const body2: Record<string, unknown> = { model: provider.model, messages: toolMessages, temperature: 0.7, max_tokens: provider.type === 'groq' ? 4096 : 8192, stream: true };
              const ctrl2 = new AbortController();
              const tid2 = setTimeout(() => ctrl2.abort(), 20000);
              const resp2 = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body2), signal: ctrl2.signal });
              clearTimeout(tid2);
              if (!resp2.ok || !resp2.body) { console.warn(`❌ FOLLOWUP_${provider.type.toUpperCase()}_FAILED: HTTP ${resp2.status}`); continue; }
              console.log(`✅ FOLLOWUP_${provider.type.toUpperCase()}_SUCCESS_KEY_${provider.keySlot ?? 'N/A'}`);
              await write(sseEvent('status', { status: 'generating', text: '✨ Final answer...' }));
              await streamProviderResponse(resp2, write);
              break;
            } catch (err: unknown) { console.warn(`❌ FOLLOWUP_FAILED: ${(err as Error)?.message}`); continue; }
          }

          await write(sseEvent('tools_used', {
            tools: toolResults.map(t => {
              let parsedArgs: ToolUsageArgs = {};
              try { parsedArgs = JSON.parse(validCalls.find(c => c.id === t.id)?.arguments || '{}') as ToolUsageArgs; } catch { /* */ }
              return { name: t.name, query: parsedArgs.query || parsedArgs.topic || '' };
            })
          }));
        }

        await write(sseEvent('status', { status: 'done', text: '✅ Complete' }));
        await write('data: [DONE]\n\n');
      } catch (e) {
        console.error('Stream error:', e);
        try { await write(sseEvent('error', { error: 'Processing failed' })); } catch { /* */ }
      } finally {
        try { await writer.close(); } catch { /* */ }
      }
    })();

    return new Response(readable, { headers: { ...CORS, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' } });
  } catch (e: unknown) {
    console.error('Fatal:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
