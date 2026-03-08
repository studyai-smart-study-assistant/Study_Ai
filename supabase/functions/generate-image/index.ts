import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GOOGLE_NATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// ─── Fallback AI Call: Lovable Gateway → Google Native API ──
async function callAI(body: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
  const nativeModel = body.model?.replace('google/', '') || 'gemini-2.5-flash';

  // Try Lovable Gateway first
  if (LOVABLE_API_KEY) {
    try {
      const response = await fetch(LOVABLE_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        console.log('✅ Lovable Gateway success');
        return await response.json();
      }
      const status = response.status;
      if (status === 402 || status === 429) {
        console.warn(`⚠️ Lovable Gateway ${status}, falling back to Google API`);
      } else {
        console.warn(`⚠️ Lovable Gateway error: ${status}, falling back`);
      }
    } catch (err) {
      console.warn('⚠️ Lovable Gateway unreachable, falling back:', err);
    }
  }

  // Fallback: Google Native API
  if (!GOOGLE_API_KEY) throw new Error('Both Lovable AI and Google API keys unavailable');
  
  console.log(`🔄 Using Google Native API: ${nativeModel}`);
  const response = await fetch(GOOGLE_NATIVE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GOOGLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model: nativeModel }),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ Google API error:', response.status, errText);
    throw new Error(`Google API error: ${response.status}`);
  }
  console.log('✅ Google Native API success');
  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, imageBase64 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isEditMode = !!imageBase64;
    console.log(`${isEditMode ? 'Editing' : 'Generating'} image with prompt:`, prompt);

    // Build message content
    let userContent: any;
    if (isEditMode) {
      userContent = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ];
    } else {
      userContent = prompt;
    }

    const data = await callAI({
      model: 'google/gemini-3-pro-image-preview',
      messages: [{ role: 'user', content: userContent }],
      modalities: ['image', 'text']
    });

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response. Full response:', JSON.stringify(data).slice(0, 500));
      throw new Error('No image generated');
    }

    console.log('✅ Image processed successfully, base64 length:', imageUrl.length);

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
