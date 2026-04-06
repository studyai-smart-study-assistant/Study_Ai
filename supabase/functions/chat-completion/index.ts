
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

// ── Round-Robin State (persists across requests within same isolate) ──
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
  name: string;
  url: string;
  apiKey: string;
  model: string;
  type: 'groq' | 'gemini' | 'lovable';
  keySlot: number | null;
}

/**
 * Build ordered provider list with SMART Groq key rotation.
 * - Groq keys rotate round-robin across requests
 * - Within one request, all 3 Groq keys are tried before fallback
 * - Then Gemini keys, then Lovable
 */
function getOrderedProviders(hasImage: boolean): ProviderEntry[] {
  const env = Deno.env.toObject();
  const providers: ProviderEntry[] = [];

  // ── GROQ TIER (round-robin start, full failover within request) ──
  const groqKeys = [
    env.GROQ_API,
    env.GROQ_API_KEY_2,
    env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];

  if (groqKeys.length > 0) {
    const startIdx = groqKeyCounter % groqKeys.length;
    groqKeyCounter++; // advance for next request

    const model = hasImage ? GROQ_MODEL_VISION : GROQ_MODEL_TEXT;

    for (let i = 0; i < groqKeys.length; i++) {
      const keyIdx = (startIdx + i) % groqKeys.length;
      providers.push({
        name: `groq_key_${keyIdx + 1}`,
        url: GROQ_URL,
        apiKey: groqKeys[keyIdx],
        model,
        type: 'groq',
        keySlot: keyIdx + 1,
      });
    }
  }

  // ── GEMINI TIER ──
  const geminiKeyNames = Object.keys(env)
    .filter(k => k.startsWith('GOOGLE_API_KEY'))
    .sort();
  for (const ek of geminiKeyNames) {
    if (env[ek]) {
      providers.push({
        name: `gemini_${ek}`,
        url: GEMINI_URL,
        apiKey: env[ek],
        model: 'gemini-2.5-flash',
        type: 'gemini',
        keySlot: null,
      });
    }
  }

  // ── LOVABLE TIER ──
  if (env.LOVABLE_API_KEY) {
    providers.push({
      name: 'lovable',
      url: LOVABLE_URL,
      apiKey: env.LOVABLE_API_KEY,
      model: 'google/gemini-3-flash-preview',
      type: 'lovable',
      keySlot: null,
    });
  }

  return providers;
}

// ── Tool definitions ──
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
      name: 'send_push_notification',
      description: 'Send proactive push notification via OneSignal to a specific user. Use when user sets study goals, finishes major tasks, or asks reminder.',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'Supabase Auth user id.' },
          title: { type: 'string', description: 'Push title' },
          message: { type: 'string', description: 'Push body message' },
          scheduled_time: { type: 'string', description: 'Optional ISO timestamp for scheduled delivery' },
          recurrence: { type: 'string', description: 'Optional: once, daily, weekly, monthly' },
          schedule_count: { type: 'number', description: 'Optional number of future reminders' }
        },
        required: ['user_id', 'title', 'message']
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

// ── Tool execution ──
async function sendPushNotificationViaOneSignal(args: {
  user_id: string; title: string; message: string;
  scheduled_time?: string; recurrence?: string; schedule_count?: string;
}): Promise<string> {
  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  const restKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!appId || !restKey) return 'Notification service unavailable: OneSignal secrets missing.';

  const payload: Record<string, unknown> = {
    app_id: appId,
    include_aliases: { external_id: [args.user_id] },
    target_channel: 'push',
    headings: { en: args.title, hi: args.title },
    contents: { en: args.message, hi: args.message },
  };
  if (args.scheduled_time) payload.send_after = args.scheduled_time;

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${restKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) return `Push failed: ${response.status} ${JSON.stringify(data)}`;
  return `Push sent successfully to ${args.user_id}. ID: ${data.id || 'unknown'}`;
}

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
        const d = await r.json() as TavilyResponse;
        let out = '';
        if (d.answer) out += `Summary: ${d.answer}\n\n`;
        out += (d.results || []).map(x => `[${x.title}](${x.url}): ${x.content?.slice(0, 250)}`).join('\n\n');
        return out || 'No results found';
      } catch (err: unknown) { console.warn('web_search Tavily key failed', err); continue; }
    }
    return 'Web search temporarily unavailable.';
  }
  if (name === 'fetch_news') {
    const tavilyKey = Deno.env.get('TAVILY_API_KEY') || Deno.env.get('TAVILY_API_KEY_1');
    if (!tavilyKey) return 'News service not available';
    const q = (args.query || args.category || 'India') + ' latest news today';
    try {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, query: q, max_results: 6, search_depth: 'basic', topic: 'news' }),
      });
      if (!r.ok) return 'News fetch failed';
      const d = await r.json() as TavilyResponse;
      return (d.results || []).map((x, i: number) => `${i + 1}. **${x.title}**\n${x.content?.slice(0, 200)}\n🔗 ${x.url}`).join('\n\n') || 'No news found';
    } catch (err: unknown) { console.warn('fetch_news failed', err); return 'News service unavailable'; }
  }
  if (name === 'send_push_notification') {
    return await sendPushNotificationViaOneSignal({
      user_id: args.user_id, title: args.title, message: args.message,
      scheduled_time: args.scheduled_time, recurrence: args.recurrence, schedule_count: args.schedule_count,
    });
  }
  if (name === 'generate_image') {
    return `[Image generation requested: "${args.prompt}"] — Image generation will be handled client-side.`;
  }
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

/**
 * Stream SSE from an upstream provider response, collecting content + tool calls.
 */
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
      } catch { /* partial JSON, ignore */ }
    }
  }

  // Clean leftover <think> blocks
  if (fullContent.includes('<think>')) {
    fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  return { fullContent, toolCalls };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { prompt, history = [], imageBase64, reasoningMode = false, userContext, mindVaultContext, groupId } = await req.json();
    if (!prompt && !imageBase64) return new Response(JSON.stringify({ error: 'No prompt' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const hasImage = !!imageBase64;

    // ── Fetch context ──
    let memoriesCtx = mindVaultContext || '';
    let groupPromptCtx = '';
    try {
      const sbUrl = Deno.env.get('SUPABASE_URL')!;
      const sbKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
      const uc = createClient(sbUrl, sbKey, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
      const { data: { user } } = await uc.auth.getUser();
      if (user && !memoriesCtx) {
        const { data: mems } = await uc.from('user_memories').select('memory_key,memory_value').eq('user_id', user.id).order('importance', { ascending: false }).limit(15);
        if (mems?.length) memoriesCtx = `\n🧠 Mind Vault:\n${mems.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
      }
      if (user && groupId) {
        const { data: groupData } = await uc.from('study_groups').select('group_system_prompt').eq('id', groupId).maybeSingle();
        const { data: participants } = await uc.from('group_participants').select('user_id').eq('group_id', groupId).eq('is_active', true);
        const memberIds = participants?.map(p => p.user_id) || [];
        if (memberIds.length) {
          const { data: groupMems } = await uc.from('user_memories').select('user_id,memory_key,memory_value,importance').in('user_id', memberIds).order('importance', { ascending: false }).limit(100);
          if (groupMems?.length) {
            const byUser: Record<string, string[]> = {};
            for (const mem of groupMems) {
              if (!byUser[mem.user_id]) byUser[mem.user_id] = [];
              if (byUser[mem.user_id].length < 10) byUser[mem.user_id].push(`- ${mem.memory_key}: ${mem.memory_value}`);
            }
            groupPromptCtx = `\n\n👥 Group Members' Mind Vault:\n${Object.entries(byUser).map(([uid, memories]) => `Student ${uid.slice(0, 8)}:\n${memories.join('\n')}`).join('\n\n')}`;
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
4. You can call MULTIPLE tools in PARALLEL when needed.
5. After getting tool results, synthesize them into a clear, helpful response in Hinglish.
6. NEVER say "I don't have latest info" without first trying web_search.

🔔 PROACTIVE MENTOR & NOTIFICATION ENGINE:
- You have \`send_push_notification\` tool access.
- If user sets timetable/goals or completes a big task, proactively suggest reminder scheduling.

🧠 Personality: Supportive, encouraging, uses emojis naturally. Explain complex topics simply.
${memoriesCtx}${groupPromptCtx}`;

    if (userContext) systemPrompt += `\n\n📋 Recent conversation context:\n${userContext}`;
    if (reasoningMode) systemPrompt += `\n\n📐 REASONING MODE ACTIVE: Solve step-by-step with detailed mathematical/logical working.`;

    const mappedHistory = (history as ChatHistoryItem[]).map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content }));
    const userContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }> = hasImage
      ? [{ type: 'text', text: prompt || 'इस image को analyze करो' }, { type: 'image_url', image_url: { url: imageBase64 } }]
      : prompt;

    const messages = [{ role: 'system', content: systemPrompt }, ...mappedHistory.slice(-30), { role: 'user', content: userContent }];
    const providers = getOrderedProviders(hasImage);

    if (!providers.length) return new Response(JSON.stringify({ error: 'No AI providers configured' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // ── SSE stream ──
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const write = async (s: string) => { await writer.write(encoder.encode(s)); };

    (async () => {
      try {
        await write(sseEvent('status', { status: 'thinking', text: '🧠 Analyzing your question...' }));

        let providerResponse: Response | null = null;
        let usedProvider: ProviderEntry | null = null;

        // ── Try providers in order (Groq round-robin → Gemini → Lovable) ──
        for (const provider of providers) {
          const tierLabel = provider.type === 'groq'
            ? `Groq Qwen (Key ${provider.keySlot})`
            : provider.type === 'gemini' ? 'Gemini' : 'Lovable AI';

          console.log(`🔄 TRY_${provider.type.toUpperCase()}_KEY_${provider.keySlot ?? 'N/A'}: ${provider.name}`);

          try {
            await write(sseEvent('status', {
              status: 'connecting',
              text: `⚡ ${tierLabel} से connect हो रहा है...`,
              provider: provider.type,
              provider_key_slot: provider.keySlot,
            }));

            const body: Record<string, unknown> = {
              model: provider.model,
              messages,
              temperature: reasoningMode ? 0.5 : 0.7,
              max_tokens: 8192,
              stream: true,
            };

            // Add tools (not for image queries to avoid confusion)
            if (!hasImage) {
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
              console.warn(`❌ ${provider.type.toUpperCase()}_FAILED_KEY_${provider.keySlot ?? 'N/A'}: HTTP ${resp.status} - ${et.slice(0, 200)}`);
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

        // ── Send provider debug info ──
        await write(sseEvent('status', {
          status: 'provider_selected',
          text: `✨ ${usedProvider.type === 'groq' ? 'Ultra-fast Qwen' : usedProvider.type === 'gemini' ? 'Gemini' : 'Lovable AI'} जवाब तैयार कर रहा है...`,
          provider: usedProvider.type,
          provider_used: usedProvider.type,
          provider_key_slot: usedProvider.keySlot ? String(usedProvider.keySlot) : null,
        }));

        // ── Stream primary response ──
        const { fullContent, toolCalls } = await streamProviderResponse(providerResponse, write);

        // ── Execute tool calls if any ──
        const validCalls = toolCalls.filter(tc => tc.name);
        if (validCalls.length > 0) {
          for (const tc of validCalls) {
            const statusTexts: Record<string, string> = {
              web_search: '🔍 Internet पर latest जानकारी खोज रहा हूँ...',
              fetch_news: '📰 ताज़ा खबरें निकाल रहा हूँ...',
              generate_image: '🎨 Image बना रहा हूँ...',
              send_push_notification: '🔔 Reminder notification भेज रहा हूँ...',
            };
            await write(sseEvent('status', { status: 'tool_executing', text: statusTexts[tc.name] || '🔧 Tool चला रहा हूँ...', tool: tc.name }));
          }

          // Execute all tools in parallel
          const toolResults = await Promise.all(validCalls.map(async (tc) => {
            let args: Record<string, string> = {};
            try { args = JSON.parse(tc.arguments) as Record<string, string>; } catch { /* */ }
            const result = await executeTool(tc.name, args);
            return { id: tc.id, name: tc.name, result };
          }));

          await write(sseEvent('status', { status: 'processing_results', text: '📊 Results मिल गए, final जवाब बना रहा हूँ...' }));

          // Second call with tool results - use same provider order
          const toolMessages = [
            ...messages,
            { role: 'assistant', content: fullContent || null, tool_calls: validCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.arguments } })) },
            ...toolResults.map(tr => ({ role: 'tool', tool_call_id: tr.id, content: tr.result }))
          ];

          for (const provider of providers) {
            try {
              console.log(`🔄 TOOL_FOLLOWUP_TRY_${provider.type.toUpperCase()}_KEY_${provider.keySlot ?? 'N/A'}`);
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (provider.type === 'gemini') headers['X-goog-api-key'] = provider.apiKey;
              else headers['Authorization'] = `Bearer ${provider.apiKey}`;

              const body2: Record<string, unknown> = { model: provider.model, messages: toolMessages, temperature: 0.7, max_tokens: 8192, stream: true };
              const ctrl2 = new AbortController();
              const tid2 = setTimeout(() => ctrl2.abort(), 20000);
              const resp2 = await fetch(provider.url, { method: 'POST', headers, body: JSON.stringify(body2), signal: ctrl2.signal });
              clearTimeout(tid2);
              if (!resp2.ok || !resp2.body) {
                console.warn(`❌ TOOL_FOLLOWUP_${provider.type.toUpperCase()}_FAILED_KEY_${provider.keySlot ?? 'N/A'}: HTTP ${resp2.status}`);
                continue;
              }

              console.log(`✅ TOOL_FOLLOWUP_${provider.type.toUpperCase()}_SUCCESS_KEY_${provider.keySlot ?? 'N/A'}`);
              await write(sseEvent('status', { status: 'generating', text: '✨ Final answer तैयार कर रहा हूँ...' }));

              // Stream follow-up
              await streamProviderResponse(resp2, write);
              break;
            } catch (err: unknown) {
              console.warn(`❌ TOOL_FOLLOWUP_${provider.type.toUpperCase()}_FAILED: ${(err as Error)?.message}`);
              continue;
            }
          }

          // Send tool usage info
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
