import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, imageBase64, history = [] } = await req.json();
    if (!prompt) throw new Error('Prompt is required');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemMessage = {
      role: 'system',
      content: `You are Study AI Live, a real-time multimodal assistant built by Ajit Kumar. You can see through the user's camera and hear them speak. Keep responses SHORT (2-4 sentences max) since they will be spoken aloud via TTS. Be conversational, friendly, and helpful. If you see an image, describe what you see and answer questions about it. Respond in the same language the user speaks (Hindi or English).`
    };

    const messages: any[] = [systemMessage];

    // Add history
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Build user message with optional image
    const userContent: any[] = [];
    if (imageBase64) {
      // Extract mime and data
      const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        userContent.push({
          type: 'image_url',
          image_url: { url: imageBase64 }
        });
      }
    }
    userContent.push({ type: 'text', text: prompt });

    messages.push({ role: 'user', content: userContent });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please wait' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Sorry, no response.';

    return new Response(JSON.stringify({ response: text, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Live chat error:', message);
    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
