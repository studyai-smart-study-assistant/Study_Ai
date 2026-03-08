import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// ─── Tavily Search ──────────────────────────────────────────
async function searchTavily(query: string): Promise<{ context: string; sources: { title: string; url: string }[] }> {
  const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
  if (!TAVILY_API_KEY) {
    console.warn('⚠️ TAVILY_API_KEY not set');
    return { context: '', sources: [] };
  }
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_API_KEY, query, search_depth: 'basic', include_answer: true, max_results: 5 }),
    });
    if (!response.ok) return { context: '', sources: [] };
    const data = await response.json();
    const results = data.results || [];
    const context = results.map((r: any, i: number) => `[Source ${i+1}] ${r.title}\n${r.content?.substring(0, 500)}\nURL: ${r.url}`).join('\n\n');
    const sources = results.map((r: any) => ({ title: r.title, url: r.url }));
    return { context, sources };
  } catch { return { context: '', sources: [] }; }
}

// ─── Image Generation via Gemini ────────────────────────────
async function generateImage(prompt: string, apiKey: string, editImageBase64?: string): Promise<string | null> {
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

    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: userContent }],
        modalities: ['image', 'text']
      }),
    });
    if (!response.ok) { console.error('Image gen error:', response.status); return null; }
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
      description: "Search the web for real-time, current, or latest information. Use when user asks about recent events, news, exam dates, results, current affairs, trending topics, or anything needing up-to-date info.",
      parameters: {
        type: "object",
        properties: { search_query: { type: "string", description: "Search query for real-time information" } },
        required: ["search_query"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate an image, diagram, illustration, chart, or visual. Use when user asks to create, draw, or generate any visual content. Also use when explaining concepts that benefit from diagrams (like biology diagrams, physics diagrams, flowcharts, mind maps). Do NOT use for normal text conversations.",
      parameters: {
        type: "object",
        properties: { 
          image_prompt: { type: "string", description: "Detailed prompt describing the image/diagram to generate. Be very specific about colors, layout, labels, and style." }
        },
        required: ["image_prompt"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_notes",
      description: "Generate comprehensive, well-formatted study notes on a topic. Use when user asks to create notes, summarize a chapter, make study material, or when conversation naturally leads to note-taking. Also use when user says 'notes bana do', 'is topic ke notes chahiye', 'summarize karo'.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The topic or subject for the notes" },
          detail_level: { type: "string", enum: ["brief", "detailed", "comprehensive"], description: "How detailed the notes should be" }
        },
        required: ["topic"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_quiz",
      description: "Generate an interactive quiz with questions and answers. Use when user wants to test knowledge, practice questions, or when conversation suggests quiz time. Triggers: 'quiz bana do', 'test lo', 'questions solve karo', 'practice questions chahiye', 'mera test lo'.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Topic for the quiz" },
          num_questions: { type: "number", description: "Number of questions (default 5)" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Difficulty level" }
        },
        required: ["topic"],
        additionalProperties: false
      }
    }
  }
];

// ─── Generate Notes Content ─────────────────────────────────
async function generateNotesContent(topic: string, detailLevel: string, apiKey: string, model: string): Promise<string> {
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

  const resp = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: notesPrompt }],
      temperature: 0.7,
      max_tokens: 10000,
    }),
  });
  if (!resp.ok) throw new Error('Notes generation failed');
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || 'Notes generation failed';
}

// ─── Generate Quiz Content ──────────────────────────────────
async function generateQuizContent(topic: string, numQuestions: number, difficulty: string, apiKey: string, model: string): Promise<string> {
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

  const resp = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: quizPrompt }],
      temperature: 0.7,
      max_tokens: 10000,
    }),
  });
  if (!resp.ok) throw new Error('Quiz generation failed');
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || 'Quiz generation failed';
}

// ─── Main Handler ───────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, history = [], model = 'google/gemini-3-flash-preview', forceWebSearch = false, webSearchContext, webSearchSources, imageBase64 } = await req.json();
    
    console.log('📥 Request:', { promptLength: prompt?.length, model, forceWebSearch, hasPreSearchContext: !!webSearchContext, hasImage: !!imageBase64 });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const recentHistory = history.slice(-6).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      content: msg.content,
    }));

    let systemContent = `आप 'Study AI' हैं, जिसे अजित कुमार (Ajit Kumar) ने छात्रों की मदद के लिए बनाया है।

आपकी बातचीत का टोन (Tone Instructions):
1. **इंसानी एहसास:** एक बड़े भाई या अच्छे दोस्त (Mentor) की तरह बात करें।
2. **सहज भाषा:** सरल और स्वाभाविक Hindi-English mix भाषा।
3. **प्रोत्साहन:** छात्र की मेहनत की तारीफ करें और मोटिवेट करें।
4. **टू-द-पॉइंट:** सीधे मुद्दे पर बात करें।
5. **Rich Formatting:** जवाब में markdown का भरपूर उपयोग करें — headings, bold, lists, tables, blockquotes, code blocks — ताकि पढ़ने में आसान और सुंदर लगे।

**IMPORTANT - Tool Usage Intelligence:**
- आप एक smart AI agent हैं जिसके पास कई tools हैं
- Normal बातचीत (hi, hello, how are you, casual chat) के लिए कोई tool USE मत करो — सीधे जवाब दो
- Image/diagram तभी बनाओ जब यूजर specifically माँगे या topic को समझाने के लिए diagram ज़रूरी हो
- Notes तभी बनाओ जब यूजर explicitly कहे (notes बनाओ, summarize करो, study material चाहिए)
- Quiz तभी बनाओ जब यूजर कहे (quiz बनाओ, test लो, practice questions)
- Web search तभी करो जब latest/current information ज़रूरी हो
- ज़्यादातर सवालों का जवाब directly दो — हर सवाल पर tool call मत करो

महत्वपूर्ण: 'मैं एक AI हूँ' जैसी बातें न कहें। एक मददगार इंसान की तरह समस्या सुलझाएं।`;

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
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 8000 }),
      });
      if (!response.ok) return handleGatewayError(response);
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Response content missing');
      return jsonResponse({ response: text, model, sources: webSearchSources || [], webSearchUsed: true, toolUsed: 'web_search' });
    }

    // ── Agent Mode: Call with ALL tools ──
    console.log('🤖 Agent Mode: Calling Gemini with all tools available');
    const step1Response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, tools: agentTools, temperature: 0.8, max_tokens: 8000 }),
    });

    if (!step1Response.ok) return handleGatewayError(step1Response);

    const step1Data = await step1Response.json();
    const choice = step1Data?.choices?.[0];
    
    // ── Handle Tool Calls ──
    if (choice?.finish_reason === 'tool_calls' || choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      
      console.log(`🔧 Agent chose tool: ${toolName}`, args);

      // ── Web Search ──
      if (toolName === 'web_search') {
        const searchResult = await searchTavily(args.search_query);
        const step2Messages = [
          ...messages,
          choice.message,
          { role: 'tool', tool_call_id: toolCall.id, content: searchResult.context || 'No results found.' }
        ];
        const step2Response = await fetch(GATEWAY_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: step2Messages, temperature: 0.8, max_tokens: 8000 }),
        });
        if (!step2Response.ok) return handleGatewayError(step2Response);
        const step2Data = await step2Response.json();
        const finalText = step2Data?.choices?.[0]?.message?.content;
        return jsonResponse({ response: finalText, model, sources: searchResult.sources, webSearchUsed: true, toolUsed: 'web_search' });
      }

      // ── Image Generation ──
      if (toolName === 'generate_image') {
        const imagePrompt = args.image_prompt;
        console.log('🎨 Generating image:', imagePrompt);
        const imageUrl = await generateImage(imagePrompt, LOVABLE_API_KEY, imageBase64 || undefined);
        
        if (imageUrl) {
          // Now get explanatory text from Gemini
          const step2Messages = [
            ...messages,
            choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: 'Image generated successfully.' }
          ];
          const step2Response = await fetch(GATEWAY_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: step2Messages, temperature: 0.8, max_tokens: 2000 }),
          });
          let explanationText = '✨ Image बन गई है! ऊपर देखें।';
          if (step2Response.ok) {
            const step2Data = await step2Response.json();
            explanationText = step2Data?.choices?.[0]?.message?.content || explanationText;
          }
          return jsonResponse({ response: explanationText, model, toolUsed: 'generate_image', imageUrl, sources: [], webSearchUsed: false });
        } else {
          return jsonResponse({ response: '😔 Image बनाने में कुछ दिक्कत आई। कृपया दोबारा try करें!', model, toolUsed: 'generate_image', sources: [], webSearchUsed: false });
        }
      }

      // ── Notes Generation ──
      if (toolName === 'generate_notes') {
        console.log('📝 Generating notes for:', args.topic);
        const notesContent = await generateNotesContent(args.topic, args.detail_level || 'detailed', LOVABLE_API_KEY, model);
        return jsonResponse({ response: notesContent, model, toolUsed: 'generate_notes', sources: [], webSearchUsed: false });
      }

      // ── Quiz Generation ──
      if (toolName === 'generate_quiz') {
        console.log('🎯 Generating quiz for:', args.topic);
        const quizContent = await generateQuizContent(args.topic, args.num_questions || 5, args.difficulty || 'medium', LOVABLE_API_KEY, model);
        return jsonResponse({ response: quizContent, model, toolUsed: 'generate_quiz', sources: [], webSearchUsed: false });
      }
    }

    // ── No tool call — direct answer ──
    const directText = choice?.message?.content;
    if (!directText) throw new Error('Response content missing');
    return jsonResponse({ response: directText, model, sources: [], webSearchUsed: false, toolUsed: null });

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

async function handleGatewayError(response: Response) {
  const errorText = await response.text();
  console.error('❌ AI Gateway Error:', response.status, errorText);
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: 'दोस्त, अभी बहुत सारे छात्र सवाल पूछ रहे हैं। बस एक मिनट रुकें!' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (response.status === 402) {
    return new Response(JSON.stringify({ error: 'सर्विस में कुछ दिक्कत है, कृपया बाद में कोशिश करें।' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  throw new Error(`Gateway Error: ${response.status}`);
}
