import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GOOGLE_NATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// ─── Google API Key Pool (Round-Robin) ──────────────────────
function getGoogleApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GOOGLE_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  const base = Deno.env.get('GOOGLE_API_KEY');
  if (base) keys.push(base);
  return [...new Set(keys)];
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
async function callAI(body: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
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

  // Fallback: Google Native API with key rotation
  const keys = getGoogleApiKeys();
  if (keys.length === 0) throw new Error('Both Lovable AI and Google API keys unavailable');
  
  console.log(`🔄 Using Google Native API: ${nativeModel} (${keys.length} keys in pool)`);

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextGoogleApiKey();
    const response = await fetch(GOOGLE_NATIVE_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, model: nativeModel }),
    });
    if (response.ok) {
      console.log(`✅ Google Native API success (key#${_keyIndex % keys.length})`);
      return await response.json();
    }
    if (response.status === 429 || response.status === 403) {
      console.warn(`⚠️ Key#${_keyIndex % keys.length} rate limited, trying next...`);
      try { await response.text(); } catch {}
      continue;
    }
    const errText = await response.text();
    console.error('❌ Google API error:', response.status, errText);
    throw new Error(`Google API error: ${response.status}`);
  }
  throw new Error('All Google API keys exhausted (rate limited)');
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
