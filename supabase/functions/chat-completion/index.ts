import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, history = [], model = 'google/gemini-3-flash-preview', webSearchContext, webSearchSources } = await req.json();
    
    console.log('📥 Request Received for Study AI:', { promptLength: prompt?.length, model, hasWebSearch: !!webSearchContext });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const recentHistory = history.slice(-6).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      content: msg.content,
    }));

    // Build system prompt - with or without web search context
    let systemContent = `आप 'Study AI' हैं, जिसे अजित कुमार (Ajit Kumar) ने छात्रों की मदद के लिए बनाया है।

आपकी बातचीत का टोन (Tone Instructions):
1. **इंसानी एहसास:** एक मशीन की तरह नहीं, बल्कि एक बड़े भाई या एक अच्छे दोस्त (Mentor) की तरह बात करें जो पढ़ाई को आसान बनाता है।
2. **सहज भाषा:** शुद्ध किताबी हिंदी के बजाय सरल और स्वाभाविक भाषा का प्रयोग करें (जैसे हम और आप बात करते हैं)।
3. **प्रोत्साहन:** छात्र की मेहनत की तारीफ करें और उसे मोटिवेट करें। 'बहुत अच्छा सवाल है', 'चिंता मत करो, मैं इसे आसान बना देता हूँ' जैसे वाक्यों का उपयोग करें।
4. **टू-द-पॉइंट:** सीधे मुद्दे पर बात करें। अगर सवाल छोटा है तो जवाब भी प्यारा और सटीक हो।
5. **अजित का विजन:** हमेशा याद रखें कि आप अजित कुमार के मिशन का हिस्सा हैं—छात्रों की पढ़ाई को तनावमुक्त और मजेदार बनाना।

महत्वपूर्ण: जवाब में 'मैं एक AI हूँ' जैसी बातें न कहें। बस एक मददगार इंसान की तरह समस्या सुलझाएं।`;

    // If web search context is provided, augment the system prompt
    if (webSearchContext) {
      systemContent += `

🌐 **वेब सर्च से मिली ताज़ा जानकारी:**
${webSearchContext}

**निर्देश:** ऊपर दी गई वेब सर्च से मिली जानकारी का उपयोग करके यूजर को एक पर्सनलाइज्ड, अप-टू-डेट जवाब दो। जानकारी को अपने शब्दों में समझाओ ताकि यूजर को लगे कि यह रियल-टाइम जानकारी है। सोर्स लिंक जवाब में शामिल मत करो—वे अलग से दिखाए जाएंगे।`;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...recentHistory,
      { role: 'user', content: prompt }
    ];

    console.log('🚀 Executing Study AI Logic with:', model);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 8000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Gateway Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'दोस्त, अभी बहुत सारे छात्र सवाल पूछ रहे हैं। बस एक मिनट रुकें और फिर पूछें!' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'सर्विस में कुछ दिक्कत है, कृपया बाद में कोशिश करें।' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Gateway Error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data?.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('Response content missing');
    }

    console.log('✅ Response generated for user');
    return new Response(JSON.stringify({ 
      response: generatedText, 
      model,
      sources: webSearchSources || [],
      webSearchUsed: !!webSearchContext,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    console.error('❌ Error in Execution:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: 'माफ़ करना दोस्त, कुछ तकनीकी दिक्कत आ गई है। एक बार फिर कोशिश करो!' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
