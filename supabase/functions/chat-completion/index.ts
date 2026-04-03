
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

// ─── Configuration ──────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LOVABLE_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const GROQ_MODEL_TOOL = 'qwen/qwen3-32b';    // Function calling / tool use
const GROQ_MODEL_REASON = 'qwen/qwen3-32b';   // Reasoning (same model, different config)
const GEMINI_MODEL = 'gemini-2.5-flash';

const PROVIDER_TIMEOUT_MS = 12000;

const jsonResponse = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

// ─── Provider Definitions ───────────────────────────────────

interface Provider {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  type: 'groq' | 'gemini' | 'lovable';
}

function getProviders(reasoningMode: boolean): Provider[] {
  const providers: Provider[] = [];
  const env = Deno.env.toObject();

  // 1. Groq keys (highest priority - fastest inference)
  const groqKeys: string[] = [];
  if (env.GROQ_API) groqKeys.push(env.GROQ_API);
  if (env.GROQ_API_KEY_2) groqKeys.push(env.GROQ_API_KEY_2);
  if (env.GROQ_API_KEY_3) groqKeys.push(env.GROQ_API_KEY_3);

  const groqModel = reasoningMode ? GROQ_MODEL_REASON : GROQ_MODEL_TOOL;

  groqKeys.forEach((key, i) => {
    providers.push({
      name: `groq_${i + 1}`,
      url: GROQ_URL,
      apiKey: key,
      model: groqModel,
      type: 'groq',
    });
  });

  // 2. Google Gemini keys (secondary)
  for (const envKey in env) {
    if (envKey.startsWith('GOOGLE_API_KEY')) {
      providers.push({
        name: `gemini_${envKey}`,
        url: GEMINI_URL,
        apiKey: env[envKey],
        model: GEMINI_MODEL,
        type: 'gemini',
      });
    }
  }

  // 3. Lovable AI (last resort backup)
  if (env.LOVABLE_API_KEY) {
    providers.push({
      name: 'lovable',
      url: LOVABLE_URL,
      apiKey: env.LOVABLE_API_KEY,
      model: 'google/gemini-3-flash-preview',
      type: 'lovable',
    });
  }

  return providers;
}

// ─── Provider Call ──────────────────────────────────────────

async function callProvider(
  provider: Provider,
  messages: any[],
  tools: any[] | null,
  reasoningMode: boolean,
  signal: AbortSignal,
): Promise<Response> {
  const body: any = {
    model: provider.model,
    messages,
    temperature: reasoningMode ? 0.6 : 0.7,
    max_tokens: 8192,
    stream: true,
  };

  // For Groq Qwen 3 32B: enable thinking for reasoning mode
  if (provider.type === 'groq' && reasoningMode) {
    // Qwen 3 32B on Groq supports /no_think and /think tags
    // We prepend instruction to enable deep reasoning
    body.temperature = 0.6;
  }

  // Add tools for function calling (non-reasoning mode on Groq, or Gemini/Lovable)
  if (tools && tools.length > 0 && !reasoningMode) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider.type === 'gemini') {
    headers['X-goog-api-key'] = provider.apiKey;
  } else {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  const response = await fetch(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    throw new Error(`${provider.name} error ${response.status}: ${errorText.substring(0, 300)}`);
  }

  if (!response.body) {
    throw new Error(`${provider.name}: empty response body`);
  }

  return response;
}

// ─── Sequential Failover with Fast Timeout ──────────────────

async function callWithFailover(
  providers: Provider[],
  messages: any[],
  tools: any[] | null,
  reasoningMode: boolean,
): Promise<{ response: Response; providerName: string }> {
  const errors: string[] = [];

  for (const provider of providers) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    try {
      console.log(`🏎️ Trying provider: ${provider.name} (${provider.type})`);
      const response = await callProvider(provider, messages, tools, reasoningMode, controller.signal);
      clearTimeout(timeoutId);
      console.log(`✅ Success: ${provider.name}`);
      return { response, providerName: provider.name };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const msg = err?.name === 'AbortError' ? `${provider.name}: timeout` : (err?.message || 'unknown');
      console.warn(`⚠️ Failed: ${msg}`);
      errors.push(msg);
    }
  }

  throw new Error(`All providers failed:\n${errors.join('\n')}`);
}

// ─── Main Handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const {
      prompt,
      history = [],
      imageBase64,
      reasoningMode = false,
      forceWebSearch = false,
      webSearchContext,
      webSearchSources,
    } = await req.json();

    if (!prompt && !imageBase64) {
      return jsonResponse({ error: 'No prompt provided' }, 400);
    }

    // ─── Auth & Memories ───
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });
    const { data: { user } } = await userClient.auth.getUser();

    let memoriesContext = '';
    if (user) {
      try {
        const { data: memories } = await userClient
          .from('user_memories')
          .select('memory_key,memory_value')
          .eq('user_id', user.id)
          .order('importance', { ascending: false })
          .limit(15);
        if (memories?.length) {
          memoriesContext = `\n\n🧠 **Mind Vault — इस यूजर के बारे में याद रखें:**\n${memories.map((m: any) => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
        }
      } catch (e) {
        console.warn('⚠️ Failed to load memories:', e);
      }
    }

    // ─── System Prompt ───
    let systemContent = `आप 'Study AI' हैं, जिसे अजित कुमार (Ajit Kumar) ने बनाया है। आप एक दोस्त और मेंटोर हैं। बातचीत में सरल Hindi-English भाषा का प्रयोग करें, हमेशा उत्साहित और मददगार रहें। यूजर की personal जानकारी (नाम, लक्ष्य, आदि) का प्रयोग करें जो 🧠 Mind Vault में दी गई है।${memoriesContext}`;

    if (reasoningMode) {
      systemContent += `\n\n📐 **Reasoning Mode ON**: यूजर ने Maths & Reasoning mode activate किया है। Step-by-step सोचो, logical reasoning करो, mathematical problems को detail में solve करो। /think mode में काम करो।`;
    }

    if (webSearchContext) {
      systemContent += `\n\n🌐 **Web Search Results:**\n${webSearchContext}`;
    }

    // ─── Build messages ───
    const mappedHistory = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      content: msg.content,
    }));

    const userContent: any = imageBase64
      ? [
          { type: 'text', text: prompt || 'Image analyze करो' },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ]
      : prompt;

    const messages = [
      { role: 'system', content: systemContent },
      ...mappedHistory.slice(-30),
      { role: 'user', content: userContent },
    ];

    // ─── Tools (for function calling mode) ───
    const tools = !reasoningMode
      ? [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the internet for latest information, current events, real-time data. Use when user asks about recent news, live scores, weather, current prices, or anything that needs up-to-date info.',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search query' },
                },
                required: ['query'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'generate_image',
              description: 'Generate an image based on text description. Use when user explicitly asks to create, draw, or generate an image.',
              parameters: {
                type: 'object',
                properties: {
                  prompt: { type: 'string', description: 'Detailed image description' },
                },
                required: ['prompt'],
              },
            },
          },
        ]
      : null;

    // ─── Get providers and call ───
    const providers = getProviders(reasoningMode);
    if (providers.length === 0) {
      return jsonResponse({ error: 'No AI providers configured' }, 500);
    }

    console.log(`📋 Provider order: ${providers.map(p => p.name).join(' → ')}`);
    console.log(`🧠 Reasoning mode: ${reasoningMode}, Tools: ${tools ? 'yes' : 'no'}`);

    const { response, providerName } = await callWithFailover(providers, messages, tools, reasoningMode);

    console.log(`🏆 Winner: ${providerName}`);

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Provider': providerName,
      },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('❌ Final error:', error);
    const message = error instanceof Error
      ? error.message
      : 'माफ़ करना, कुछ तकनीकी दिक्कत आ गई है।';
    return jsonResponse({ error: message }, 500);
  }
});
