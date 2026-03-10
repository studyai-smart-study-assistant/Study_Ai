import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GOOGLE_NATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ─── Robust, Stateless API Key Management ──────────────────
function getApiKeys(baseEnvName: string): string[] {
    const keys: string[] = [];
    for (let i = 1; i <= 10; i++) {
        const k = Deno.env.get(`${baseEnvName}_${i}`);
        if (k) keys.push(k);
    }
    const baseKey = Deno.env.get(baseEnvName);
    if (baseKey) keys.push(baseKey);
    return [...new Set(keys)];
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const googleApiKeys = getApiKeys('GOOGLE_API_KEY');
const tavilyApiKeys = getApiKeys('TAVILY_API_KEY');

class AiProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AiProviderError';
    this.status = status;
  }
}

// ─── Generic JSON Response Helper ───────────────────────────
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Usage Logger ───────────────────────────────────────────
async function logApiUsage(service: string, keyId: string, status: string, errorCode?: string, responseTimeMs?: number) {
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(url, key);
    await client.from('api_key_usage').insert({
      service, key_identifier: keyId, status,
      error_code: errorCode || null,
      response_time_ms: responseTimeMs || null,
    });
  } catch (e) { console.warn('⚠️ Usage log failed:', e); }
}

// ─── [CORRECTED] Fallback AI Call with Shuffle & Retry Logic ──
async function callAI(body: any, options?: { modalities?: string[] }): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const nativeModel = body.model?.replace('google/', '') || 'gemini-2.5-flash';

  if (LOVABLE_API_KEY) {
    try {
      const payload = { ...body };
      if (options?.modalities) payload.modalities = options.modalities;
      const start = Date.now();
      const response = await fetch(LOVABLE_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('✅ Lovable Gateway success');
        logApiUsage('lovable-gateway', 'LOVABLE_KEY', 'success', undefined, Date.now() - start);
        return response;
      }
      const status = response.status, gatewayErrorText = await response.text();
      logApiUsage('lovable-gateway', 'LOVABLE_KEY', 'error', String(status), Date.now() - start);
      if (status === 429 || status === 402) {
        console.warn(`⚠️ Lovable Gateway quota/rate limited (${status}), falling back to Google API`);
      } else {
        console.warn(`⚠️ Lovable Gateway error ${status}: ${gatewayErrorText.substring(0, 250)}`);
      }
    } catch (err) {
      logApiUsage('lovable-gateway', 'LOVABLE_KEY', 'error', 'network');
      console.warn('⚠️ Lovable Gateway unreachable, falling back to Google API:', err);
    }
  }

  if (googleApiKeys.length === 0) {
    throw new AiProviderError(503, 'AI service configuration missing. No Google API keys found.');
  }

  console.log(`🔄 Using Google Native API with model: ${nativeModel}. Shuffling between ${googleApiKeys.length} keys.`);
  const payload: any = { ...body, model: nativeModel };
  if (options?.modalities) payload.modalities = options.modalities;
  const shuffledKeys = shuffleArray([...googleApiKeys]);

  for (let i = 0; i < shuffledKeys.length; i++) {
    const apiKey = shuffledKeys[i], keyLabel = `GOOGLE_KEY_SHUFFLE_${i+1}`, start = Date.now();
    try {
      const response = await fetch(GOOGLE_NATIVE_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Google Native API success (${keyLabel})`);
        logApiUsage('google-gemini', keyLabel, 'success', undefined, Date.now() - start);
        return response;
      }

      const status = response.status, errText = await response.text();
      if (status === 429 || status === 403) {
        logApiUsage('google-gemini', keyLabel, 'rate_limited', String(status), Date.now() - start);
        console.warn(`⚠️ Google API ${status} on ${keyLabel}, trying next key...`);
      } else {
        logApiUsage('google-gemini', keyLabel, 'error', String(status), Date.now() - start);
        console.error(`❌ Google Native API error (${keyLabel}):`, status, errText.substring(0, 200));
      }
    } catch (e: unknown) {
      logApiUsage('google-gemini', keyLabel, 'network_error', e.message, Date.now() - start);
      console.warn(`⚠️ Google API network error on ${keyLabel}:`, e);
    }
  }

  console.warn('⚠️ All Google API keys failed. Trying other fallbacks...');

  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  if (OPENROUTER_API_KEY) {
    console.log('🔄 Trying OpenRouter fallback...');
    try {
      const orPayload: any = { ...body, model: body.model?.startsWith('google/') ? body.model : 'google/gemini-pro' };
      delete orPayload.tools; delete orPayload.tool_choice;
      const start = Date.now();
      const orResponse = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://study-ai-001-41.lovable.app', 'X-Title': 'Study AI',
        },
        body: JSON.stringify(orPayload),
      });
      if (orResponse.ok) {
        console.log('✅ OpenRouter fallback success');
        logApiUsage('openrouter', 'OPENROUTER_KEY', 'success', undefined, Date.now() - start);
        return orResponse;
      }
      const orStatus = orResponse.status, orErr = await orResponse.text();
      logApiUsage('openrouter', 'OPENROUTER_KEY', 'error', String(orStatus), Date.now() - start);
      console.warn(`⚠️ OpenRouter error ${orStatus}: ${orErr.substring(0, 200)}`);
    } catch (e) { console.warn('⚠️ OpenRouter network error:', e); }
  }

  throw new AiProviderError(429, 'AI अभी थोड़ी देर के लिए busy है. सारे API Providers में दिक्कत आ रही है. 1-2 मिनट बाद फिर try करें।');
}

async function searchTavily(query: string): Promise<{ context: string; sources: { title: string; url: string }[] }> {
  if (tavilyApiKeys.length === 0) {
    console.warn('⚠️ No Tavily API keys set');
    return { context: '', sources: [] };
  }
  const shuffledKeys = shuffleArray([...tavilyApiKeys]);
  for (let i = 0; i < shuffledKeys.length; i++) {
    const apiKey = shuffledKeys[i], keyLabel = `TAVILY_KEY_SHUFFLE_${i+1}`, start = Date.now();
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', include_answer: true, max_results: 5 }),
      });
      if (response.ok) {
        const data = await response.json();
        logApiUsage('tavily', keyLabel, 'success', undefined, Date.now() - start);
        const results = data.results || [];
        const context = results.map((r: any, i: number) => `[Source ${i+1}] ${r.title}\n${r.content?.substring(0, 500)}\nURL: ${r.url}`).join('\n\n');
        const sources = results.map((r: any) => ({ title: r.title, url: r.url }));
        return { context, sources };
      }
      logApiUsage('tavily', keyLabel, 'error', String(response.status), Date.now() - start);
      console.warn(`⚠️ Tavily API error on ${keyLabel}, status: ${response.status}. Trying next key.`);
    } catch (e) {
      logApiUsage('tavily', keyLabel, 'network_error', e.message, Date.now() - start);
      console.warn(`⚠️ Tavily network error on ${keyLabel}:`, e);
    }
  }
  console.error('❌ All Tavily API keys failed.');
  return { context: '', sources: [] };
}

async function generateImage(prompt: string, editImageBase64?: string): Promise<string | null> {
  try {
    const userContent: any = editImageBase64
      ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: editImageBase64 } }]
      : prompt;
    const response = await callAI(
      { model: 'google/gemini-3-pro-image-preview', messages: [{ role: 'user', content: userContent }] },
      { modalities: ['image', 'text'] }
    );
    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch (err) { console.error('Image generation failed:', err); return null; }
}

const agentTools = [
  { type: "function", function: { name: "web_search", description: "Search the web for real-time, current, or latest information.", parameters: { type: "object", properties: { search_query: { type: "string", description: "Search query" } }, required: ["search_query"], additionalProperties: false } } },
  { type: "function", function: { name: "generate_image", description: "Generate an image, diagram, or visual. Use when user asks to create/draw visuals.", parameters: { type: "object", properties: { image_prompt: { type: "string", description: "Detailed image prompt" } }, required: ["image_prompt"], additionalProperties: false } } },
  { type: "function", function: { name: "generate_notes", description: "Generate study notes. Use ONLY when user EXPLICITLY says 'notes बनाओ'.", parameters: { type: "object", properties: { topic: { type: "string" }, detail_level: { type: "string", enum: ["brief", "detailed", "comprehensive"] } }, required: ["topic"], additionalProperties: false } } },
  { type: "function", function: { name: "generate_quiz", description: "Generate interactive quiz. Use when user EXPLICITLY asks for quiz/test. If user hasn't specified topic, subject, class, difficulty, or number of questions — DO NOT call this tool. Instead, ask the user for these details first.", parameters: { type: "object", properties: { topic: { type: "string" }, num_questions: { type: "number" }, difficulty: { type: "string", enum: ["easy", "medium", "hard"] }, class_level: { type: "string" } }, required: ["topic"], additionalProperties: false } } }
];

async function generateNotesContent(topic: string, detailLevel: string, model: string): Promise<string> {
  const notesPrompt = `आप एक expert study notes creator हैं। \"${topic}\" पर ${detailLevel === 'comprehensive' ? 'विस्तृत' : 'संक्षिप्त'} study notes बनाएं। Format: Title, bold concepts, blockquotes, lists, headings, code blocks for formulas, and a quick revision section. Use Hindi-English mix.`;
  const resp = await callAI({ model, messages: [{ role: 'user', content: notesPrompt }], temperature: 0.7, max_tokens: 10000 });
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || 'Notes generation failed';
}

async function generateQuizContent(topic: string, numQuestions: number, difficulty: string, model: string): Promise<string> {
  const quizPrompt = `\"${topic}\" पर ${numQuestions} ${difficulty} level के MCQ quiz questions बनाएं। Respond ONLY with valid JSON in the specified format: {title, topic, difficulty, questions: [{id, question, options, correctAnswer, explanation}]}. Use Hindi-English mix.`;
  const resp = await callAI({ model, messages: [{ role: 'user', content: quizPrompt }], temperature: 0.7, max_tokens: 10000 });
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.questions) return `[QUIZ_DATA:${JSON.stringify(parsed)}]`;
    }
  } catch (e) { console.warn('⚠️ Quiz JSON parse failed'); }
  return content || 'Quiz generation failed';
}

async function triggerMemoryCuration(userId: string, userMessage: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await adminClient.functions.invoke('curate-and-save-memory', { body: { userId, statement: userMessage } });
    if (error) console.warn(`⚠️ Memory curation invocation failed: ${error.message}`);
  } catch (e) { console.warn('⚠️ Background memory curation trigger failed:', e.message); }
}

// ─── Main Handler ───────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt, history = [], model = 'google/gemini-3-flash-preview', forceWebSearch = false, webSearchContext, webSearchSources, imageBase64 } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();

    let memoriesContext = '';
    if (user) {
      try {
        const { data: memories } = await userClient.from('user_memories').select('memory_key,memory_value,category').eq('user_id', user.id).order('importance', { ascending: false }).limit(20);
        if (memories?.length) {
          // [CORRECTED] Use proper newline character \n
          memoriesContext = `\n\n🧠 **Mind Vault — इस यूजर के बारे में याद रखें:**\n${memories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
        }
      } catch (e) { console.warn('⚠️ Failed to load memories:', e); }
    }

    const systemContent = `आप 'Study AI' हैं, जिसे अजित कुमार (Ajit Kumar) ने बनाया है। आप एक दोस्त और मेंटोर हैं। बातचीत में सरल Hindi-English भाषा का प्रयोग करें, हमेशा उत्साहित और मददगार रहें। यूजर की personal जानकारी (नाम, लक्ष्य, आदि) का प्रयोग करें जो 🧠 Mind Vault में दी गई है।${memoriesContext}`;

    const userContent: any = imageBase64
      ? [{ type: 'text', text: prompt || (imageBase64.includes('pdf') ? 'PDF analyze करो' : 'Image analyze करो') }, { type: 'image_url', image_url: { url: imageBase64 } }]
      : prompt;

    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-30).map((msg: { role: string; content: string }) => ({ role: msg.role === 'bot' ? 'assistant' : msg.role, content: msg.content })),
      { role: 'user', content: userContent }
    ];

    if (webSearchContext) {
      const response = await callAI({ model, messages, temperature: 0.8, max_tokens: 8000 });
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      return jsonResponse({ response: text, model, sources: webSearchSources || [], webSearchUsed: true, toolUsed: 'web_search' });
    }

    const step1Response = await callAI({ model, messages, tools: agentTools, temperature: 0.7, max_tokens: 8000 });
    const step1Data = await step1Response.json();
    const choice = step1Data?.choices?.[0];

    if (choice?.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`🔧 Agent decided: ${toolName}`, args);

      const thinkingMap: Record<string, string> = {
        'web_search': `🔍 Web Search: "${args.search_query}"`,
        'generate_image': `🎨 Image Generation: "${args.image_prompt?.substring(0, 80)}..."`,
        'generate_notes': `📝 Notes: "${args.topic}"`,
        'generate_quiz': `🎯 Quiz: "${args.topic}"`,
      };
      const thinking = thinkingMap[toolName] || `🔧 Tool: ${toolName}`;

      if (toolName === 'web_search') {
        const searchResult = await searchTavily(args.search_query);
        const step2Messages = [...messages, choice.message, { role: 'tool', tool_call_id: toolCall.id, content: searchResult.context || 'No results found.' }];
        const step2Response = await callAI({ model, messages: step2Messages, temperature: 0.8, max_tokens: 8000 });
        const step2Data = await step2Response.json();
        const finalText = step2Data?.choices?.[0]?.message?.content;
        return jsonResponse({ response: finalText, model, sources: searchResult.sources, webSearchUsed: true, toolUsed: 'web_search', thinking });
      }

      if (toolName === 'generate_image') {
        const imageUrl = await generateImage(args.image_prompt, imageBase64);
        const explanationText = '✨ Image बन गई है!';
        return jsonResponse({ response: explanationText, model, toolUsed: 'generate_image', imageUrl, sources: [], webSearchUsed: false, thinking });
      }

      if (toolName === 'generate_notes') {
        const notesContent = await generateNotesContent(args.topic, args.detail_level || 'detailed', model);
        return jsonResponse({ response: notesContent, model, toolUsed: 'generate_notes', sources: [], webSearchUsed: false, thinking });
      }

      if (toolName === 'generate_quiz') {
        const quizContent = await generateQuizContent(args.topic, args.num_questions || 5, args.difficulty || 'medium', model);
        if (user) triggerMemoryCuration(user.id, `User took a quiz on: ${args.topic}`).catch(console.warn);
        return jsonResponse({ response: quizContent, model, toolUsed: 'generate_quiz', sources: [], webSearchUsed: false, thinking });
      }
    }

    const directText = choice?.message?.content;
    if (!directText) throw new Error('Response content missing');
    if (user && prompt) triggerMemoryCuration(user.id, prompt).catch(console.warn);
    return jsonResponse({ response: directText, model, sources: [], webSearchUsed: false, toolUsed: null, thinking: null });

  } catch (error: unknown) {
    console.error('❌ Error in main handler:', error);
    const errorMessage = error instanceof AiProviderError ? error.message : 'माफ़ करना दोस्त, कुछ तकनीकी दिक्कत आ गई है। एक बार फिर कोशिश करो!';
    return jsonResponse({ error: errorMessage }, 500);
  }
});
