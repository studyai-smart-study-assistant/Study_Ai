import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, history = [], model = 'google/gemini-2.5-flash' } = await req.json();
    
    console.log('📥 Received chat completion request:', { 
      promptLength: prompt?.length, 
      historyLength: history?.length,
      model 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Limit history to last 6 messages to prevent AI from repeating all previous answers
    // This keeps context for personalization but avoids token waste and repetition
    const recentHistory = history.slice(-6);
    
    console.log('📜 Using recent history:', recentHistory.length, 'messages (from', history.length, 'total)');

    // Prepare messages array with optimized system prompt
    const messages = [
      {
        role: 'system',
        content: `आप एक सहायक AI शिक्षक हैं। आप हिंदी और अंग्रेजी दोनों में छात्रों की मदद करते हैं।

महत्वपूर्ण निर्देश:
1. केवल वर्तमान प्रश्न का उत्तर दें - पिछले प्रश्नों को दोहराएं नहीं
2. उत्तर सीधा और संक्षिप्त हो - अनावश्यक विस्तार न करें
3. यदि 2 अंक का प्रश्न है तो 3-4 लाइन में उत्तर दें
4. पिछली बातचीत का संदर्भ रखें लेकिन उसे repeat न करें
5. प्रत्येक प्रश्न का एक ही बार जवाब दें`
      },
      ...recentHistory,
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log('🚀 Calling Lovable AI Gateway with model:', model);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 8000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. कृपया कुछ समय बाद पुनः प्रयास करें।' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. कृपया अपने Lovable AI credits को top up करें।' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('✅ Successfully generated response, length:', generatedText?.length);

    return new Response(JSON.stringify({ 
      response: generatedText,
      model: model 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Error in chat-completion function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
