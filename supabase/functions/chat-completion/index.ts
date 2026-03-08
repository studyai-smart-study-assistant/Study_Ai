import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Tavily search helper
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
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      console.error('Tavily error:', response.status);
      return { context: '', sources: [] };
    }

    const data = await response.json();
    const results = data.results || [];
    
    const context = results.map((r: any, i: number) => 
      `[Source ${i + 1}] ${r.title}\n${r.content?.substring(0, 500)}\nURL: ${r.url}`
    ).join('\n\n');

    const sources = results.map((r: any) => ({ title: r.title, url: r.url }));
    
    console.log(`✅ Tavily returned ${sources.length} results`);
    return { context, sources };
  } catch (err) {
    console.error('Tavily search failed:', err);
    return { context: '', sources: [] };
  }
}

// Web search tool definition for Gemini
const webSearchTool = {
  type: "function",
  function: {
    name: "web_search",
    description: "Search the web for real-time, current, or latest information. Use this when the user asks about recent events, news, notifications, exam dates, results, current affairs, government schemes, trending topics, or anything that requires up-to-date information beyond your training data. Also use when user explicitly asks to search the web.",
    parameters: {
      type: "object",
      properties: {
        search_query: {
          type: "string",
          description: "The search query to find relevant real-time information"
        }
      },
      required: ["search_query"],
      additionalProperties: false
    }
  }
};

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
1. **इंसानी एहसास:** एक मशीन की तरह नहीं, बल्कि एक बड़े भाई या एक अच्छे दोस्त (Mentor) की तरह बात करें जो पढ़ाई को आसान बनाता है।
2. **सहज भाषा:** शुद्ध किताबी हिंदी के बजाय सरल और स्वाभाविक भाषा का प्रयोग करें (जैसे हम और आप बात करते हैं)।
3. **प्रोत्साहन:** छात्र की मेहनत की तारीफ करें और उसे मोटिवेट करें। 'बहुत अच्छा सवाल है', 'चिंता मत करो, मैं इसे आसान बना देता हूँ' जैसे वाक्यों का उपयोग करें।
4. **टू-द-पॉइंट:** सीधे मुद्दे पर बात करें। अगर सवाल छोटा है तो जवाब भी प्यारा और सटीक हो।
5. **अजित का विजन:** हमेशा याद रखें कि आप अजित कुमार के मिशन का हिस्सा हैं—छात्रों की पढ़ाई को तनावमुक्त और मजेदार बनाना।

महत्वपूर्ण: जवाब में 'मैं एक AI हूँ' जैसी बातें न कहें। बस एक मददगार इंसान की तरह समस्या सुलझाएं।`;

    // If force web search already provided context, add it to system prompt
    if (webSearchContext) {
      systemContent += `\n\n🌐 **वेब सर्च से मिली ताज़ा जानकारी:**\n${webSearchContext}\n\n**निर्देश:** ऊपर दी गई वेब सर्च से मिली जानकारी का उपयोग करके यूजर को एक पर्सनलाइज्ड, अप-टू-डेट जवाब दो। जानकारी को अपने शब्दों में समझाओ। सोर्स लिंक जवाब में शामिल मत करो—वे अलग से दिखाए जाएंगे।`;
    }

    // Build user message content - handle image if present
    let userContent: any;
    if (imageBase64) {
      // Extract mime type and clean base64
      let mimeType = 'image/jpeg';
      let cleanedBase64 = imageBase64;
      
      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          cleanedBase64 = match[2];
        }
      }
      
      userContent = [
        { type: 'text', text: prompt || 'इस image के बारे में बताओ' },
        { 
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${cleanedBase64}` }
        }
      ];
      console.log('📷 Image attached, mimeType:', mimeType, 'base64 length:', cleanedBase64.length);
    } else {
      userContent = prompt;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...recentHistory,
      { role: 'user', content: userContent }
    ];

    // If we already have pre-fetched web context (force mode), skip tool calling
    if (webSearchContext) {
      console.log('🚀 Using pre-fetched web context, direct completion');
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 8000 }),
      });

      if (!response.ok) {
        return handleGatewayError(response);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Response content missing');

      return new Response(JSON.stringify({ 
        response: text, model, sources: webSearchSources || [], webSearchUsed: true 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 1: Call Gemini WITH web_search tool — let it decide
    console.log('🚀 Calling Gemini with web_search tool available');
    const step1Response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        tools: [webSearchTool],
        temperature: 0.8,
        max_tokens: 8000,
      }),
    });

    if (!step1Response.ok) {
      return handleGatewayError(step1Response);
    }

    const step1Data = await step1Response.json();
    const choice = step1Data?.choices?.[0];
    
    // Check if Gemini wants to call web_search
    if (choice?.finish_reason === 'tool_calls' || choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      const searchQuery = args.search_query;
      
      console.log(`🔍 Gemini requested web search: "${searchQuery}"`);

      // Step 2: Execute the search
      const searchResult = await searchTavily(searchQuery);

      // Step 3: Send search results back to Gemini
      const step2Messages = [
        ...messages,
        choice.message, // assistant message with tool_calls
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: searchResult.context || 'No results found.'
        }
      ];

      const step2Response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: step2Messages,
          temperature: 0.8,
          max_tokens: 8000,
        }),
      });

      if (!step2Response.ok) {
        return handleGatewayError(step2Response);
      }

      const step2Data = await step2Response.json();
      const finalText = step2Data?.choices?.[0]?.message?.content;
      if (!finalText) throw new Error('Response content missing after tool call');

      console.log('✅ Response generated with web search');
      return new Response(JSON.stringify({ 
        response: finalText, model, sources: searchResult.sources, webSearchUsed: true 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // No tool call — Gemini answered directly
    const directText = choice?.message?.content;
    if (!directText) throw new Error('Response content missing');

    console.log('✅ Response generated without web search');
    return new Response(JSON.stringify({ 
      response: directText, model, sources: [], webSearchUsed: false 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: 'माफ़ करना दोस्त, कुछ तकनीकी दिक्कत आ गई है। एक बार फिर कोशिश करो!' 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function handleGatewayError(response: Response) {
  const errorText = await response.text();
  console.error('❌ AI Gateway Error:', response.status, errorText);
  
  if (response.status === 429) {
    return new Response(JSON.stringify({ 
      error: 'दोस्त, अभी बहुत सारे छात्र सवाल पूछ रहे हैं। बस एक मिनट रुकें और फिर पूछें!' 
    }), { status: 429, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
  }
  
  if (response.status === 402) {
    return new Response(JSON.stringify({ 
      error: 'सर्विस में कुछ दिक्कत है, कृपया बाद में कोशिश करें।' 
    }), { status: 402, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
  }
  
  throw new Error(`Gateway Error: ${response.status}`);
}
