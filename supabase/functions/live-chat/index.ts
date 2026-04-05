import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const GOOGLE_NATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

type MessageContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string | MessageContentPart[] };
type AIRequestBody = { model?: string; messages: ChatMessage[]; max_tokens?: number };
type AIResponseBody = { choices?: Array<{ message?: { content?: string } }> };
type HistoryItem = { role: string; content: string };

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
async function callAI(body: AIRequestBody): Promise<AIResponseBody> {
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
      try {
        await response.text();
      } catch (readError: unknown) {
        console.warn('Failed to read limited-key response body', readError);
      }
      continue;
    }
    const errText = await response.text();
    console.error('❌ Google API error:', response.status, errText);
    throw new Error(`Google API error: ${response.status}`);
  }
  throw new Error('All Google API keys exhausted (rate limited)');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, imageBase64, history = [] } = await req.json() as { prompt?: string; imageBase64?: string; history?: HistoryItem[] };
    if (!prompt) throw new Error('Prompt is required');

    const systemMessage: ChatMessage = {
      role: 'system' as const,
      content: `You are Study AI Live, a real-time multimodal assistant built by Ajit Kumar. Keep responses SHORT (1-3 sentences max) because replies are spoken aloud. Always use any provided image for visual grounding before answering. NEVER guess visual details when no image is provided. If camera image is missing, clearly say you cannot see the camera yet and ask user to hold camera steady and try again. Respond in the same language as the user (Hindi or English).`
    };

    const messages: ChatMessage[] = [systemMessage];

    // Add history
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Build user message with required camera frame for multimodal live mode
    if (!imageBase64) {
      return new Response(JSON.stringify({
        response: 'मैं अभी कैमरा फ़्रेम नहीं देख पा रहा हूँ, कृपया कैमरा स्थिर रखें और दोबारा बोलें।',
        success: true,
        needsCamera: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userContent: MessageContentPart[] = [];
    const match = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (match) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageBase64 }
      });
    }
    userContent.push({ type: 'text', text: prompt });

    messages.push({ role: 'user', content: userContent });

    const data = await callAI({
      model: 'google/gemini-3-flash-preview',
      messages,
      max_tokens: 180,
    });

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
