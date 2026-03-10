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

// ─── Google API Key Pool (Round-Robin) ──────────────────────
function getGoogleApiKeys(): string[] {
  const keys: string[] = [];
  // Add numbered keys first
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GOOGLE_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  // Add original key as fallback
  const base = Deno.env.get('GOOGLE_API_KEY');
  if (base) keys.push(base);
  return [...new Set(keys)]; // deduplicate
}

let _keyIndex = 0;
function getNextGoogleApiKey(): string {
  const keys = getGoogleApiKeys();
  if (keys.length === 0) throw new Error('No Google API keys configured');
  const key = keys[_keyIndex % keys.length];
  _keyIndex = (_keyIndex + 1) % keys.length;
  return key;
}

class AiProviderError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AiProviderError';
    this.status = status;
  }
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

// ─── Fallback AI Call: Lovable Gateway → Google Native API (with key rotation) ──
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

      const status = response.status;
      const gatewayErrorText = await response.text();
      logApiUsage('lovable-gateway', 'LOVABLE_KEY', 'error', String(status), Date.now() - start);

      // If tool schema/payload is invalid for gateway, retry once with a sanitized payload
      if (status === 400 && payload.tools) {
        console.warn('⚠️ Lovable Gateway 400 with tools. Retrying with sanitized payload...');
        const sanitizedPayload = {
          ...payload,
          max_tokens: Math.min(payload.max_tokens || 2000, 4000),
        } as Record<string, unknown>;
        delete sanitizedPayload.tools;
        delete sanitizedPayload.tool_choice;

        const retry = await fetch(LOVABLE_GATEWAY_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedPayload),
        });

        if (retry.ok) {
          console.log('✅ Lovable Gateway success (sanitized retry)');
          return retry;
        }

        const retryText = await retry.text();
        console.warn(`⚠️ Sanitized retry failed: ${retry.status} ${retryText.substring(0, 200)}`);
      } else if (status === 429 || status === 402) {
        console.warn(`⚠️ Lovable Gateway quota/rate limited (${status}), falling back to Google API`);
      } else {
        console.warn(`⚠️ Lovable Gateway error ${status}: ${gatewayErrorText.substring(0, 250)}`);
      }
    } catch (err) {
      logApiUsage('lovable-gateway', 'LOVABLE_KEY', 'error', 'network');
      console.warn('⚠️ Lovable Gateway unreachable, falling back to Google API:', err);
    }
  }

  const keys = getGoogleApiKeys();
  if (keys.length === 0) {
    throw new AiProviderError(503, 'AI service configuration missing. Please try again shortly.');
  }

  console.log(`🔄 Using Google Native API with model: ${nativeModel} (${keys.length} keys in pool)`);

  const payload: any = { ...body, model: nativeModel };
  if (options?.modalities) payload.modalities = options.modalities;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }

    const apiKey = getNextGoogleApiKey();
    const keyLabel = `GOOGLE_KEY_${(_keyIndex) % keys.length}`;
    const start = Date.now();

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

      const status = response.status;
      const errText = await response.text();

      if (status === 429 || status === 403) {
        logApiUsage('google-gemini', keyLabel, 'rate_limited', String(status), Date.now() - start);
        console.warn(`⚠️ Google API ${status} on ${keyLabel}, rotating to next key...`);
        continue;
      }

      logApiUsage('google-gemini', keyLabel, 'error', String(status), Date.now() - start);
      console.error(`❌ Google Native API error (${keyLabel}):`, status, errText);
      throw new AiProviderError(status, `Google API error: ${status}`);
    } catch (e: unknown) {
      if (e instanceof AiProviderError) throw e;
      console.warn(`⚠️ Google API network error on ${keyLabel}:`, e);
      continue;
    }
  }

  // ── Fallback 3: OpenRouter ──
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  if (OPENROUTER_API_KEY) {
    console.log('🔄 All Google keys exhausted, trying OpenRouter fallback...');
    try {
      const orModel = body.model?.startsWith('google/') 
        ? body.model.replace('google/', 'google/') // OpenRouter uses same format
        : 'google/gemini-2.5-flash';
      
      const orPayload: any = { ...body, model: orModel };
      if (options?.modalities) orPayload.modalities = options.modalities;
      // Remove tools if present to avoid schema issues on OpenRouter
      delete orPayload.tools;
      delete orPayload.tool_choice;

      const start = Date.now();
      const orResponse = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://study-ai-001-41.lovable.app',
          'X-Title': 'Study AI',
        },
        body: JSON.stringify(orPayload),
      });

      if (orResponse.ok) {
        console.log('✅ OpenRouter fallback success');
        logApiUsage('openrouter', 'OPENROUTER_KEY', 'success', undefined, Date.now() - start);
        return orResponse;
      }

      const orStatus = orResponse.status;
      const orErr = await orResponse.text();
      logApiUsage('openrouter', 'OPENROUTER_KEY', 'error', String(orStatus), Date.now() - start);
      console.warn(`⚠️ OpenRouter error ${orStatus}: ${orErr.substring(0, 200)}`);
    } catch (e) {
      console.warn('⚠️ OpenRouter network error:', e);
    }
  }

  // ── Fallback 4: RapidAPI ChatGPT-42 ──
  const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
  if (RAPIDAPI_KEY) {
    console.log('🔄 All other providers exhausted, trying RapidAPI ChatGPT-42 fallback...');
    try {
      const start = Date.now();
      const rapidMessages = body.messages?.map((m: any) => ({
        role: m.role === 'bot' ? 'assistant' : m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })) || [];

      const rapidResponse = await fetch('https://chatgpt-42.p.rapidapi.com/conversationgpt4-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
        body: JSON.stringify({
          messages: rapidMessages,
          web_access: false,
        }),
      });

      if (rapidResponse.ok) {
        const rapidData = await rapidResponse.json();
        console.log('✅ RapidAPI ChatGPT-42 fallback success');
        logApiUsage('rapidapi-chatgpt42', 'RAPIDAPI_KEY', 'success', undefined, Date.now() - start);

        // Normalize to OpenAI-compatible format
        const normalizedResponse = {
          choices: [{
            message: {
              role: 'assistant',
              content: rapidData.result || rapidData.message || rapidData.response || JSON.stringify(rapidData),
            },
            finish_reason: 'stop',
          }],
        };

        return new Response(JSON.stringify(normalizedResponse), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const rapidErr = await rapidResponse.text();
      logApiUsage('rapidapi-chatgpt42', 'RAPIDAPI_KEY', 'error', String(rapidResponse.status), Date.now() - start);
      console.warn(`⚠️ RapidAPI error ${rapidResponse.status}: ${rapidErr.substring(0, 200)}`);
    } catch (e) {
      console.warn('⚠️ RapidAPI network error:', e);
    }
  }

  throw new AiProviderError(429, 'AI अभी थोड़ी देर के लिए busy है (rate limited). 1-2 मिनट बाद फिर try करें।');
}

// ─── Tavily Key Pool (Round-Robin) ──────────────────────────
function getTavilyApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const k = Deno.env.get(`TAVILY_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  const base = Deno.env.get('TAVILY_API_KEY');
  if (base) keys.push(base);
  return [...new Set(keys)];
}

let _tavilyKeyIndex = 0;
function getNextTavilyKey(): string {
  const keys = getTavilyApiKeys();
  if (keys.length === 0) throw new Error('No Tavily API keys configured');
  const key = keys[_tavilyKeyIndex % keys.length];
  _tavilyKeyIndex = (_tavilyKeyIndex + 1) % keys.length;
  return key;
}

// ─── Tavily Search with Key Rotation ────────────────────────
async function searchTavily(query: string): Promise<{ context: string; sources: { title: string; url: string }[] }> {
  const keys = getTavilyApiKeys();
  if (keys.length === 0) {
    console.warn('⚠️ No Tavily API keys set');
    return { context: '', sources: [] };
  }
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextTavilyKey();
    const keyLabel = `TAVILY_KEY_${(_tavilyKeyIndex) % keys.length}`;
    const start = Date.now();
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', include_answer: true, max_results: 5 }),
      });
      if (response.status === 429 || response.status === 403) {
        logApiUsage('tavily', keyLabel, 'rate_limited', String(response.status), Date.now() - start);
        console.warn(`⚠️ Tavily ${keyLabel} rate limited, trying next...`);
        try { await response.text(); } catch {}\
        continue;
      }
      if (!response.ok) return { context: '', sources: [] };
      const data = await response.json();
      logApiUsage('tavily', keyLabel, 'success', undefined, Date.now() - start);
      const results = data.results || [];
      const context = results.map((r: any, i: number) => `[Source ${i+1}] ${r.title}\\n${r.content?.substring(0, 500)}\\nURL: ${r.url}`).join('\\n\\n');
      const sources = results.map((r: any) => ({ title: r.title, url: r.url }));
      return { context, sources };
    } catch { continue; }
  }
  console.warn('⚠️ All Tavily keys exhausted');
  return { context: '', sources: [] };
}

// ─── Image Generation via Gemini ────────────────────────────
async function generateImage(prompt: string, editImageBase64?: string): Promise<string | null> {
  try {
    let userContent: any;
    if (editImageBase64) {
      userContent = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: editImageBase64 } }
      ];
    } else {
      userContent = prompt;
    }

    const response = await callAI({
      model: 'google/gemini-3-pro-image-preview',
      messages: [{ role: 'user', content: userContent }],
    }, { modalities: ['image', 'text'] });

    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch (err) { console.error('Image generation failed:', err); return null; }
}

// ─── Tool Definitions ───────────────────────────────────────
const agentTools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for real-time, current, or latest information.",
      parameters: { type: "object", properties: { search_query: { type: "string", description: "Search query" } }, required: ["search_query"], additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image, diagram, or visual. Use when user asks to create/draw visuals.",
      parameters: { type: "object", properties: { image_prompt: { type: "string", description: "Detailed image prompt" } }, required: ["image_prompt"], additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_notes",
      description: "Generate study notes. Use ONLY when user EXPLICITLY says 'notes बनाओ'.",
      parameters: { type: "object", properties: { topic: { type: "string" }, detail_level: { type: "string", enum: ["brief", "detailed", "comprehensive"] } }, required: ["topic"], additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_quiz",
      description: "Generate interactive quiz. Use when user EXPLICITLY asks for quiz/test. If user hasn't specified topic, subject, class, difficulty, or number of questions — DO NOT call this tool. Instead, ask the user for these details first in a friendly conversational way. Only call this tool when you have enough info (at minimum: topic).",
      parameters: { type: "object", properties: { topic: { type: "string", description: "Specific topic for quiz" }, num_questions: { type: "number", description: "Number of questions (default 5)" }, difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Difficulty level" }, class_level: { type: "string", description: "Student class like 10th, 12th etc." } }, required: ["topic"], additionalProperties: false }
    }
  }
];

// ─── Generate Notes Content ─────────────────────────────────
async function generateNotesContent(topic: string, detailLevel: string, model: string): Promise<string> {
  const notesPrompt = `आप एक expert study notes creator हैं। \"${topic}\" पर ${detailLevel === 'comprehensive' ? 'विस्तृत और गहरे' : detailLevel === 'detailed' ? 'अच्छे विस्तार से' : 'संक्षिप्त'} study notes बनाएं।

**Notes Format Rules:**
- शुरू में एक आकर्षक title (# emoji + Title) दें
- Key concepts को **bold** करें
- Important definitions को > blockquote में रखें
- Points को bullet (•) या numbered list में रखें
- हर section का clear heading (##) दें
- Important formulas या facts को \`code block\` में दें
- अंत में "📝 Quick Revision Points" section दें
- Hindi-English mix language में लिखें जो students को आसान लगे
- Tables use करें जहां comparison हो
- Mnemonics या tricks दें जो याद रखने में मदद करें`;

  const resp = await callAI({
    model,
    messages: [{ role: 'user', content: notesPrompt }],
    temperature: 0.7,
    max_tokens: 10000,
  });
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || 'Notes generation failed';
}

// ─── Generate Quiz Content (Structured JSON) ───────────────
async function generateQuizContent(topic: string, numQuestions: number, difficulty: string, model: string): Promise<string> {
  const quizPrompt = `\"${topic}\" पर ${numQuestions} ${difficulty} level के MCQ quiz questions बनाएं।

You MUST respond with ONLY valid JSON in this exact format, no extra text:
{
  "title": "Quiz title here",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text in Hindi-English mix",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation why this answer is correct"
    }
  ]
}

Rules:
- correctAnswer is the 0-based index of the correct option
- Questions should be exam-oriented for Bihar Board / competitive exams
- Use Hindi-English mix language
- Options should be realistic and tricky
- Each question MUST have exactly 4 options
- Provide clear explanation for each answer
- Generate exactly ${numQuestions} questions
- ONLY output JSON, nothing else`;

  const resp = await callAI({
    model,
    messages: [{ role: 'user', content: quizPrompt }],
    temperature: 0.7,
    max_tokens: 10000,
  });
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  
  // Try to parse as JSON and wrap in QUIZ_DATA tag
  try {
    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return `[QUIZ_DATA:${JSON.stringify(parsed)}]`;
      }
    }
  } catch (e) {
    console.warn('⚠️ Quiz JSON parse failed, falling back to text format');
  }
  
  // Fallback: return as text
  return content || 'Quiz generation failed';
}

// ─── [NEW] Smart Background Memory Curation ──────────────────
async function triggerMemoryCuration(userId: string, userMessage: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // We need to use the service role key to invoke edge functions
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await adminClient.functions.invoke('curate-and-save-memory', {
      body: { userId, statement: userMessage },
    });

    if (error) {
      throw new Error(`Memory curation function invocation failed: ${error.message}`);
    }

    console.log('🧠 Memory Curation Result:', data);
  } catch (e) {
    console.warn('⚠️ Background memory curation trigger failed:', e.message);
  }
}


// ─── Main Handler ───────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, history = [], model = 'google/gemini-3-flash-preview', forceWebSearch = false, webSearchContext, webSearchSources, imageBase64 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authData } = await userClient.auth.getUser();
    const authenticatedUserId = authData?.user?.id;

    console.log('📥 Request:', {
      promptLength: prompt?.length,
      model,
      forceWebSearch,
      hasImage: !!imageBase64,
      authenticatedUser: authenticatedUserId ? authenticatedUserId.substring(0, 8) : null,
    });

    // ── Fetch user memories from Mind Vault (RLS-enforced read) ──
    let memoriesContext = '';
    if (authenticatedUserId) {
      try {
        const { data: memories } = await userClient
          .from('user_memories')
          .select('memory_key, memory_value, category')
          .eq('user_id', authenticatedUserId)
          .order('importance', { ascending: false })
          .limit(20);

        if (memories?.length) {
          memoriesContext = `\\n\\n🧠 **Mind Vault — इस यूजर के बारे में याद रखें:**\\n${memories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\\n')}`;\
          console.log(`🧠 Loaded ${memories.length} memories for user`);
        }
      } catch (e) {
        console.warn('⚠️ Failed to load memories:', e);
      }
    }

    const recentHistory = history.slice(-30).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      content: msg.content,
    }));

    let systemContent = `आप 'Study AI' हैं, जिसे अजित कुमार (Ajit Kumar) ने छात्रों की मदद के लिए बनाया है।

आपकी बातचीत का टोन (Tone Instructions):
1. **इंसानी एहसास:** एक बड़े भाई या अच्छे दोस्त (Mentor) की तरह बात करें।
2. **सहज भाषा:** सरल और स्वाभाविक Hindi-English mix भाषा।
3. **प्रोत्साहन:** छात्र की मेहनत की तारीफ करें और मोटिवेट करें।
4. **टू-द-पॉइंट:** सीधे मुद्दे पर बात करें।
5. **Rich Formatting:** जवाब में markdown का भरपूर उपयोग करें।
6. **Personalization (CRITICAL):** नीचे 🧠 Mind Vault section में यूजर की personal जानकारी दी गई है। इसे ACTIVELY इस्तेमाल करें:
   - यूजर को उनके नाम से बुलाएं (अगर नाम stored है)
   - उनकी पसंद, लक्ष्य, और चुनौतियों को हर जवाब में ध्यान रखें
   - अगर यूजर किसी subject में struggle कर रहा है और वही topic पूछे, तो acknowledge करें: "पिछली बार भी यह topic आया था, चलो इसे और अच्छे से समझते हैं!"
   - Exam prep, study habits, और goals को personalized tips में weave करें

**CRITICAL - Tool Usage Intelligence (STRICTLY FOLLOW):**
- आप एक smart AI agent हैं जिसके पास कई tools हैं, लेकिन ज़्यादातर सवालों का जवाब DIRECTLY दो
- **कोई tool USE मत करो** इन cases में:
  • Normal बातचीत (hi, hello, kaise ho, casual chat)
  • General knowledge questions
  • Simple Q&A, explanations, definitions
- **generate_notes** ONLY when: यूजर EXPLICITLY कहे "notes बनाओ"
- **generate_image** ONLY when: यूजर EXPLICITLY कहे "diagram बनाओ", "image बनाओ"
- **generate_quiz** ONLY when: यूजर EXPLICITLY कहे "quiz बनाओ", "test लो". BUT if user just says "quiz बनाओ" without specifying topic/subject/class, then FIRST ASK them: किस विषय (subject) पर? कौन सी class? कितने questions? कौन सा difficulty level? — THEN generate quiz when they provide details.
- **web_search** ONLY when: Latest/current information ज़रूरी हो
- DEFAULT behavior: Direct answer without any tool call

महत्वपूर्ण: 'मैं एक AI हूँ' जैसी बातें न कहें। एक मददगार इंसान की तरह समस्या सुलझाएं।${memoriesContext}`;

    // If force web search already provided context
    if (webSearchContext) {
      systemContent += `\\n\\n🌐 **वेब सर्च से मिली ताज़ा जानकारी:**\\n${webSearchContext}\\n\\n**निर्देश:** ऊपर दी गई जानकारी का उपयोग करके पर्सनलाइज्ड, अप-टू-डेट जवाब दो। सोर्स लिंक जवाब में शामिल मत करो।`;
    }

    // Build user message content (supports images and PDFs)
    let userContent: any;
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let cleanedBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) { mimeType = match[1]; cleanedBase64 = match[2]; }
      }
      
      const isPdf = mimeType === 'application/pdf';
      const defaultPrompt = isPdf ? 'इस PDF document को analyze करो और इसकी जानकारी दो' : 'इस image के बारे में बताओ';
      
      userContent = [
        { type: 'text', text: prompt || defaultPrompt },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanedBase64}` } }
      ];
    } else {
      userContent = prompt;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...recentHistory,
      { role: 'user', content: userContent }
    ];

    // ── Pre-fetched web context mode ──
    if (webSearchContext) {
      const response = await callAI({ model, messages, temperature: 0.8, max_tokens: 8000 });
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Response content missing');
      return jsonResponse({ response: text, model, sources: webSearchSources || [], webSearchUsed: true, toolUsed: 'web_search' });
    }

    // ── Step 1: THINKING — Agent analyzes the query first ──
    console.log('🧠 Thinking Phase: Analyzing user query...');
    
    const thinkingSystemContent = systemContent + `\\n\\n**THINKING MODE — STRICT RULES:**
Before responding, carefully analyze the user\'s intent:
1. Is this a greeting, casual chat, or general question? → Reply directly, NO tools. Most queries fall here.
2. Does user EXPLICITLY ask to create/draw/generate an image or diagram? (e.g., "diagram बनाओ", "image बनाओ") → generate_image
3. Does user EXPLICITLY ask to create study notes? (e.g., "notes बना दो", "summarize करके notes दो") → generate_notes
4. Does user EXPLICITLY ask for quiz/test/practice? (e.g., "quiz बनाओ", "test लो") → generate_quiz
5. Does user ask about current events, latest news, exam dates? → web_search
6. "X के बारे में बताओ" or "X की जानकारी चाहिए" = NORMAL ANSWER, NOT notes!
7. When in doubt, DEFAULT to direct answer without tools.

CRITICAL: Do NOT use tools unless user EXPLICITLY requests that specific functionality.`;

    const step1Response = await callAI({
      model,
      messages: [
        { role: 'system', content: thinkingSystemContent },
        ...recentHistory,
        { role: 'user', content: userContent }
      ],
      tools: agentTools,
      temperature: 0.7,
      max_tokens: 8000,
    });

    const step1Data = await step1Response.json();
    const choice = step1Data?.choices?.[0];
    
    // ── Handle Tool Calls ──
    if (choice?.finish_reason === 'tool_calls' || choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      console.log(`🔧 Agent decided: ${toolName}`, args);

      // Generate thinking summary based on tool chosen
      const thinkingMap: Record<string, string> = {
        'web_search': `🔍 यूजर को latest जानकारी चाहिए → Web Search कर रहा हूँ: \"${args.search_query}\"`,
        'generate_image': `🎨 यूजर को visual/diagram चाहिए → Image generate कर रहा हूँ: \"${args.image_prompt?.substring(0, 80)}...\"`,
        'generate_notes': `📝 यूजर को study notes चाहिए → \"${args.topic}\" पर ${args.detail_level || 'detailed'} notes बना रहा हूँ`,
        'generate_quiz': `🎯 यूजर quiz/test चाहता है → \"${args.topic}\" पर ${args.num_questions || 5} questions का ${args.difficulty || 'medium'} quiz बना रहा हूँ`,
      };
      const thinking = thinkingMap[toolName] || `🔧 Tool: ${toolName}`;\

      // ── Web Search ──
      if (toolName === 'web_search') {
        const searchResult = await searchTavily(args.search_query);
        const step2Messages = [
          ...messages,
          choice.message,
          { role: 'tool', tool_call_id: toolCall.id, content: searchResult.context || 'No results found.' }
        ];
        const step2Response = await callAI({ model, messages: step2Messages, temperature: 0.8, max_tokens: 8000 });
        const step2Data = await step2Response.json();
        const finalText = step2Data?.choices?.[0]?.message?.content;
        return jsonResponse({ response: finalText, model, sources: searchResult.sources, webSearchUsed: true, toolUsed: 'web_search', thinking });
      }

      // ── Image Generation ──
      if (toolName === 'generate_image') {
        const imagePrompt = args.image_prompt;
        const imageUrl = await generateImage(imagePrompt, imageBase64 || undefined);
        
        if (imageUrl) {
          const step2Messages = [
            ...messages,
            choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: 'Image generated successfully.' }
          ];
          const step2Response = await callAI({ model, messages: step2Messages, temperature: 0.8, max_tokens: 2000 });
          let explanationText = '✨ Image बन गई है!';
          if (step2Response) {
            const step2Data = await step2Response.json();
            explanationText = step2Data?.choices?.[0]?.message?.content || explanationText;
          }
          return jsonResponse({ response: explanationText, model, toolUsed: 'generate_image', imageUrl, sources: [], webSearchUsed: false, thinking });
        } else {
          return jsonResponse({ response: '😔 Image बनाने में दिक्कत आई। दोबारा try करें!', model, toolUsed: 'generate_image', sources: [], webSearchUsed: false, thinking });
        }
      }

      // ── Notes Generation ──
      if (toolName === 'generate_notes') {
        const notesContent = await generateNotesContent(args.topic, args.detail_level || 'detailed', model);
        return jsonResponse({ response: notesContent, model, toolUsed: 'generate_notes', sources: [], webSearchUsed: false, thinking });
      }

      // ── Quiz Generation ──
      if (toolName === 'generate_quiz') {
        const quizContent = await generateQuizContent(args.topic, args.num_questions || 5, args.difficulty || 'medium', model);
        
        // Save quiz topic to memory for knowledge tracking
        if (authenticatedUserId) {
            triggerMemoryCuration(authenticatedUserId, `User took a quiz on: ${args.topic}`).catch(e => console.warn(e));
        }
        
        return jsonResponse({ response: quizContent, model, toolUsed: 'generate_quiz', sources: [], webSearchUsed: false, thinking });
      }
    }

    // ── No tool call — direct answer (normal conversation) ──
    const directText = choice?.message?.content;
    if (!directText) throw new Error('Response content missing');

    // ── [NEW] Trigger memory curation for logged-in users ──
    if (authenticatedUserId && prompt) {
      // Don't wait for it, let it run in the background
      triggerMemoryCuration(authenticatedUserId, prompt).catch(e => console.warn(e));
    }
    
    // Normal conversation — no thinking badge needed
    return jsonResponse({ response: directText, model, sources: [], webSearchUsed: false, toolUsed: null, thinking: null });

  } catch (error: unknown) {
    console.error('❌ Error:', error);

    if (error instanceof AiProviderError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'माफ़ करना दोस्त, कुछ तकनीकी दिक्कत आ गई है। एक बार फिर कोशिश करो!'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
