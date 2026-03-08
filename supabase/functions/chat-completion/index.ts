import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GOOGLE_NATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

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

// ─── Fallback AI Call: Lovable Gateway → Google Native API (with key rotation) ──
async function callAI(body: any, options?: { modalities?: string[] }): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  // Strip google/ prefix for native API
  const nativeModel = body.model?.replace('google/', '') || 'gemini-2.5-flash';

  // Try Lovable Gateway first
  if (LOVABLE_API_KEY) {
    try {
      const payload = { ...body };
      if (options?.modalities) payload.modalities = options.modalities;

      const response = await fetch(LOVABLE_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('✅ Lovable Gateway success');
        return response;
      }

      const status = response.status;
      if (status !== 402 && status !== 429) {
        // Non-quota error, still return it
        console.warn(`⚠️ Lovable Gateway error: ${status}`);
        // Fall through to Google
      } else {
        console.warn(`⚠️ Lovable Gateway quota/rate limited (${status}), falling back to Google API`);
      }
    } catch (err) {
      console.warn('⚠️ Lovable Gateway unreachable, falling back to Google API:', err);
    }
  }

  // Fallback: Google Native API with key rotation
  const keys = getGoogleApiKeys();
  if (keys.length === 0) {
    throw new Error('Both Lovable AI and Google API keys are unavailable');
  }

  console.log(`🔄 Using Google Native API with model: ${nativeModel} (${keys.length} keys in pool)`);

  const payload: any = { ...body, model: nativeModel };
  if (options?.modalities) payload.modalities = options.modalities;

  // Try each key until one works
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextGoogleApiKey();
    const keyLabel = `key#${(_keyIndex) % keys.length}`;

    const response = await fetch(GOOGLE_NATIVE_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✅ Google Native API success (${keyLabel})`);
      return response;
    }

    const status = response.status;
    if (status === 429 || status === 403) {
      console.warn(`⚠️ Google API ${status} on ${keyLabel}, rotating to next key...`);
      try { await response.text(); } catch {} // consume body
      continue;
    }

    // Non-rate-limit error, don't retry
    const errText = await response.text();
    console.error(`❌ Google Native API error (${keyLabel}):`, status, errText);
    throw new Error(`Google API error: ${status}`);
  }

  throw new Error('All Google API keys exhausted (rate limited)');
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
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', include_answer: true, max_results: 5 }),
      });
      if (response.status === 429 || response.status === 403) {
        console.warn(`⚠️ Tavily key#${_tavilyKeyIndex} rate limited, trying next...`);
        try { await response.text(); } catch {}
        continue;
      }
      if (!response.ok) return { context: '', sources: [] };
    const data = await response.json();
    const results = data.results || [];
    const context = results.map((r: any, i: number) => `[Source ${i+1}] ${r.title}\n${r.content?.substring(0, 500)}\nURL: ${r.url}`).join('\n\n');
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
      description: "Generate quiz. Use ONLY when user EXPLICITLY says 'quiz बनाओ' or 'test लो'.",
      parameters: { type: "object", properties: { topic: { type: "string" }, num_questions: { type: "number" }, difficulty: { type: "string", enum: ["easy", "medium", "hard"] } }, required: ["topic"], additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "extract_memory",
      description: "Extract and save important personal info user shared — name, preferences, goals, struggles, exam details, favorite subjects. DO NOT use for general questions or study content. Only use when user reveals something personal/important about themselves.",
      parameters: {
        type: "object",
        properties: {
          memories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string", description: "Short label like 'नाम', 'पसंदीदा विषय', 'लक्ष्य'" },
                value: { type: "string", description: "The info to remember" },
                category: { type: "string", enum: ["personal", "academic", "preference", "goal", "struggle", "general"] }
              },
              required: ["key", "value", "category"]
            }
          }
        },
        required: ["memories"],
        additionalProperties: false
      }
    }
  }
];

// ─── Save Memories to DB ────────────────────────────────────
function normalizeMemoryKey(rawKey: string): string {
  const key = (rawKey || '').trim().toLowerCase();
  if (!key) return 'general_info';
  if (key.includes('नाम') || key.includes('name')) return 'name';
  if (key.includes('class') || key.includes('grade') || key.includes('कक्षा')) return 'class';
  if (key.includes('goal') || key.includes('लक्ष्य') || key.includes('target')) return 'goal';
  if (key.includes('subject') || key.includes('विषय')) return 'subject_preference';
  return key.replace(/\s+/g, '_').slice(0, 64);
}

async function saveMemories(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  memories: Array<{key: string; value: string; category: string}>
): Promise<void> {
  try {
    const validMemories = memories
      .filter((m) => m?.key?.trim() && m?.value?.trim())
      .map((m) => ({
        user_id: userId,
        memory_key: normalizeMemoryKey(m.key),
        memory_value: m.value.trim().slice(0, 500),
        category: m.category || 'general',
        source: 'ai_detected',
        importance: 8,
      }));

    if (!validMemories.length) return;

    const { error } = await adminClient
      .from('user_memories')
      .upsert(validMemories, { onConflict: 'user_id,memory_key' });

    if (error) throw error;
    console.log(`🧠 Saved ${validMemories.length} memories for user ${userId.slice(0, 8)}...`);
  } catch (e) {
    console.warn('⚠️ Failed to save memories:', e);
  }
}

// ─── Generate Notes Content ─────────────────────────────────
async function generateNotesContent(topic: string, detailLevel: string, model: string): Promise<string> {
  const notesPrompt = `आप एक expert study notes creator हैं। "${topic}" पर ${detailLevel === 'comprehensive' ? 'विस्तृत और गहरे' : detailLevel === 'detailed' ? 'अच्छे विस्तार से' : 'संक्षिप्त'} study notes बनाएं।

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

// ─── Generate Quiz Content ──────────────────────────────────
async function generateQuizContent(topic: string, numQuestions: number, difficulty: string, model: string): Promise<string> {
  const quizPrompt = `"${topic}" पर ${numQuestions} ${difficulty} level के MCQ quiz questions बनाएं।

**STRICT FORMAT - Follow exactly:**

## 🎯 Quiz: ${topic}
**Difficulty:** ${difficulty === 'easy' ? '🟢 Easy' : difficulty === 'hard' ? '🔴 Hard' : '🟡 Medium'} | **Questions:** ${numQuestions}

---

### Q1. [Question text here]

- A) Option 1
- B) Option 2  
- C) Option 3
- D) Option 4

<details>
<summary>✅ Answer देखें</summary>

**Correct Answer: B) Option 2**

**Explanation:** यहाँ detailed explanation लिखें कि यह answer सही क्यों है और बाकी गलत क्यों हैं।

</details>

---

(Repeat for all questions)

### 📊 Score Card
अपने answers check करें और score calculate करें!
- ${numQuestions}/${numQuestions} — 🏆 Excellent!
- ${Math.ceil(numQuestions*0.7)}+/${numQuestions} — 👍 Good Job!
- ${Math.ceil(numQuestions*0.5)}/${numQuestions} — 📚 More Practice Needed

**Rules:**
- Hindi-English mix language use करें
- Questions exam-oriented हों
- Each question का proper explanation दें
- Options realistic और tricky हों`;

  const resp = await callAI({
    model,
    messages: [{ role: 'user', content: quizPrompt }],
    temperature: 0.7,
    max_tokens: 10000,
  });
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || 'Quiz generation failed';
}

// ─── Smart Background Memory Extraction (ChatGPT-level) ──
async function backgroundExtractMemories(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string,
  conversationHistory: Array<{role: string; content: string}>,
  model: string
): Promise<void> {
  try {
    // First fetch existing memories to avoid duplicates and enable updates
    let existingMemories: Array<{memory_key: string; memory_value: string}> = [];
    try {
      const { data } = await adminClient
        .from('user_memories')
        .select('memory_key, memory_value')
        .eq('user_id', userId);
      if (data) existingMemories = data;
    } catch {}

    const existingContext = existingMemories.length > 0
      ? `\n\nAlready stored memories:\n${existingMemories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`
      : '';

    // Include recent conversation for better context understanding
    const recentConvo = conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

    const extractPrompt = `You are an advanced personal memory extraction AI. Your job is to analyze conversations and extract MEANINGFUL personal information about the user that would help personalize future interactions.

CURRENT CONVERSATION:
${recentConvo}

LATEST USER MESSAGE: "${userMessage}"
${existingContext}

EXTRACTION RULES:
1. Extract ONLY genuinely personal/important info — name, age, class, school, city, exam target, weak/strong subjects, hobbies, learning style, study schedule, family details, career goals
2. DO NOT extract: study questions, general knowledge, greetings, casual chat content
3. If user CORRECTS or UPDATES previously stored info, extract the NEW value (it will overwrite)
4. If user says "मेरा नाम X है" → extract name as X
5. If user mentions struggling with a subject → extract as struggle
6. If user mentions preparing for an exam → extract exam target
7. Look for IMPLICIT info too: "12th ka exam hai" → class: 12th
8. Detect emotional state and study patterns if mentioned repeatedly
9. If NO personal info found, respond with: {"memories":[]}

USE THESE STANDARDIZED KEYS:
- name, age, class, school, city, state, board (CBSE/ICSE etc)
- exam_target, career_goal, preparation_stage
- strong_subjects, weak_subjects, favorite_subject
- study_hours, preferred_time, learning_style
- hobbies, interests
- For other info use descriptive_snake_case keys

Respond ONLY with valid JSON:
{"memories":[{"key":"standardized_key","value":"extracted value in user's language","category":"personal|academic|preference|goal|struggle|general"}]}`;

    const resp = await callAI({
      model: 'google/gemini-2.5-flash-lite', // Use cheapest model for extraction
      messages: [{ role: 'user', content: extractPrompt }],
      temperature: 0.1,
      max_tokens: 800,
    });

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]);
    const memories = parsed?.memories;

    if (memories && Array.isArray(memories) && memories.length > 0) {
      // Filter out duplicates — only save if value actually changed
      const newMemories = memories.filter((m: any) => {
        const existing = existingMemories.find(e => e.memory_key === normalizeMemoryKey(m.key));
        return !existing || existing.memory_value.toLowerCase() !== m.value.trim().toLowerCase();
      });

      if (newMemories.length > 0) {
        await saveMemories(adminClient, userId, newMemories);
        console.log(`🧠 Smart extraction: saved ${newMemories.length} new/updated memories (skipped ${memories.length - newMemories.length} duplicates)`);
      } else {
        console.log('🧠 Smart extraction: no new info to save');
      }
    }
  } catch (e) {
    console.warn('⚠️ Background memory extraction error:', e);
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
          memoriesContext = `\n\n🧠 **Mind Vault — इस यूजर के बारे में याद रखें:**\n${memories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
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
   - अगर कोई नई important जानकारी मिले (नाम, goal, struggle, preference), तो extract_memory tool से Mind Vault में save करें

**CRITICAL - Tool Usage Intelligence (STRICTLY FOLLOW):**
- आप एक smart AI agent हैं जिसके पास कई tools हैं, लेकिन ज़्यादातर सवालों का जवाब DIRECTLY दो
- **कोई tool USE मत करो** इन cases में:
  • Normal बातचीत (hi, hello, kaise ho, casual chat)
  • General knowledge questions
  • Simple Q&A, explanations, definitions
- **generate_notes** ONLY when: यूजर EXPLICITLY कहे "notes बनाओ"
- **generate_image** ONLY when: यूजर EXPLICITLY कहे "diagram बनाओ", "image बनाओ"
- **generate_quiz** ONLY when: यूजर EXPLICITLY कहे "quiz बनाओ", "test लो"
- **web_search** ONLY when: Latest/current information ज़रूरी हो
- **extract_memory** ONLY when: यूजर ने कोई important personal info share की हो (नाम, पसंद, लक्ष्य, चुनौती)
- DEFAULT behavior: Direct answer without any tool call

महत्वपूर्ण: 'मैं एक AI हूँ' जैसी बातें न कहें। एक मददगार इंसान की तरह समस्या सुलझाएं।${memoriesContext}`;

    // If force web search already provided context
    if (webSearchContext) {
      systemContent += `\n\n🌐 **वेब सर्च से मिली ताज़ा जानकारी:**\n${webSearchContext}\n\n**निर्देश:** ऊपर दी गई जानकारी का उपयोग करके पर्सनलाइज्ड, अप-टू-डेट जवाब दो। सोर्स लिंक जवाब में शामिल मत करो।`;
    }

    // Build user message content
    let userContent: any;
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let cleanedBase64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) { mimeType = match[1]; cleanedBase64 = match[2]; }
      }
      userContent = [
        { type: 'text', text: prompt || 'इस image के बारे में बताओ' },
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
    
    const thinkingSystemContent = systemContent + `\n\n**THINKING MODE — STRICT RULES:**
Before responding, carefully analyze the user's intent:
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
        'web_search': `🔍 यूजर को latest जानकारी चाहिए → Web Search कर रहा हूँ: "${args.search_query}"`,
        'generate_image': `🎨 यूजर को visual/diagram चाहिए → Image generate कर रहा हूँ: "${args.image_prompt?.substring(0, 80)}..."`,
        'generate_notes': `📝 यूजर को study notes चाहिए → "${args.topic}" पर ${args.detail_level || 'detailed'} notes बना रहा हूँ`,
        'generate_quiz': `🎯 यूजर quiz/test चाहता है → "${args.topic}" पर ${args.num_questions || 5} questions का ${args.difficulty || 'medium'} quiz बना रहा हूँ`,
      };
      const thinking = thinkingMap[toolName] || `🔧 Tool: ${toolName}`;

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
        return jsonResponse({ response: quizContent, model, toolUsed: 'generate_quiz', sources: [], webSearchUsed: false, thinking });
      }

      // ── Memory Extraction ──
      if (toolName === 'extract_memory' && authenticatedUserId) {
        await saveMemories(adminClient, authenticatedUserId, args.memories || []);
        // Continue to generate a normal response after saving
        const step2Messages = [
          ...messages,
          choice.message,
          { role: 'tool', tool_call_id: toolCall.id, content: 'Memories saved successfully.' }
        ];
        const step2Response = await callAI({ model, messages: step2Messages, temperature: 0.8, max_tokens: 8000 });
        const step2Data = await step2Response.json();
        const finalText = step2Data?.choices?.[0]?.message?.content || 'जानकारी याद रख ली! 🧠';
        return jsonResponse({ response: finalText, model, sources: [], webSearchUsed: false, toolUsed: 'extract_memory', thinking: `🧠 यूजर की ${args.memories?.length || 0} ज़रूरी जानकारी Mind Vault में save कर रहा हूँ` });
      }
    }

    // ── No tool call — direct answer (normal conversation) ──
    const directText = choice?.message?.content;
    if (!directText) throw new Error('Response content missing');

    // ── Reliable Memory Extraction for logged-in users ──
    if (authenticatedUserId && prompt) {
      await backgroundExtractMemories(adminClient, authenticatedUserId, prompt, recentHistory, model);
    }
    
    // Normal conversation — no thinking badge needed
    return jsonResponse({ response: directText, model, sources: [], webSearchUsed: false, toolUsed: null, thinking: null });

  } catch (error: unknown) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: 'माफ़ करना दोस्त, कुछ तकनीकी दिक्कत आ गई है। एक बार फिर कोशिश करो!' 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
