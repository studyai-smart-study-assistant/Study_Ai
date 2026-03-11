import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Study AI - Gemini Chat Service via Lovable AI Gateway
 * Developed by: Ajit Kumar
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, history = [], apiKeyType = 'default' } = await req.json();
    if (!prompt) throw new Error('Prompt is required');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = "Identity: You are Study AI, built by Ajit Kumar. Style: Ultra-conversational mentor. Behavior: Smart, helpful, friend-like tone. Answer in Hindi-English mix (Hinglish) when the user writes in Hindi. Goal: Make learning exciting!";

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      { role: "user", content: prompt }
    ];

    // Try Lovable Gateway first
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.75,
        max_tokens: 4096,
      }),
    });

    // Fallback to OpenRouter if Lovable fails
    if (!response.ok) {
      const status = response.status;
      console.warn(`⚠️ Lovable Gateway failed (${status}), trying OpenRouter...`);
      
      const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
      if (OPENROUTER_API_KEY) {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mystudyai.online",
            "X-Title": "Study AI",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
            temperature: 0.75,
            max_tokens: 4096,
          }),
        });

        if (response.ok) {
          console.log('✅ OpenRouter fallback success');
        }
      }
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", success: false }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds.", success: false }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "No response generated.";

    return new Response(
      JSON.stringify({ response: responseText, generatedText: responseText, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("gemini-chat error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
