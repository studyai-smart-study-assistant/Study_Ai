import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Sarvam Key Pool (Round-Robin) ──────────────────────────
function getSarvamApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`SARVAM_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  const base = Deno.env.get('SARVAM_API_KEY');
  if (base) keys.push(base);
  return [...new Set(keys)];
}

let _sarvamKeyIndex = 0;
function getNextSarvamKey(): string {
  const keys = getSarvamApiKeys();
  if (keys.length === 0) throw new Error('No Sarvam API keys configured');
  const key = keys[_sarvamKeyIndex % keys.length];
  _sarvamKeyIndex = (_sarvamKeyIndex + 1) % keys.length;
  return key;
}

// Strip markdown formatting for cleaner TTS
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, language, voice } = await req.json();
    if (!text) throw new Error('Text is required');

    const keys = getSarvamApiKeys();
    if (keys.length === 0) {
      return new Response(JSON.stringify({ error: 'No TTS provider configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanText = stripMarkdown(text);
    console.log(`🔊 TTS request: ${cleanText.substring(0, 80)}... (${cleanText.length} chars, ${keys.length} keys in pool)`);

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const apiKey = getNextSarvamKey();
      try {
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'API-Subscription-Key': apiKey,
          },
          body: JSON.stringify({
            text: cleanText,
            target_language_code: language || 'hi-IN',
            speaker: voice || 'priya',
            model: 'bulbul:v3',
            enable_preprocessing: true,
          }),
        });

        if (response.status === 429 || response.status === 403) {
          console.warn(`⚠️ Sarvam TTS key#${_sarvamKeyIndex} rate limited, trying next...`);
          try { await response.text(); } catch {}
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Sarvam API error:', response.status, errorText);
          throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.audios && data.audios[0]) {
          console.log(`✅ TTS success (key#${_sarvamKeyIndex})`);
          return new Response(JSON.stringify({ audioContent: data.audios[0] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('No audio data in Sarvam response');
      } catch (err: any) {
        if (attempt === keys.length - 1) throw err;
        console.warn(`⚠️ Sarvam TTS attempt ${attempt + 1} failed: ${err.message}`);
      }
    }
    throw new Error('All Sarvam TTS keys exhausted');

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ TTS error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
