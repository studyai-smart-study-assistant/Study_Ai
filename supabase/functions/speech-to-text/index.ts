import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function logUsage(keyId: string, status: string, errorCode?: string, ms?: number) {
  try {
    const c = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await c.from('api_key_usage').insert({ service: 'sarvam-stt', key_identifier: keyId, status, error_code: errorCode || null, response_time_ms: ms || null });
  } catch {}
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keys = getSarvamApiKeys();
    if (keys.length === 0) throw new Error('No Sarvam API keys configured');

    const { audio, language } = await req.json();
    if (!audio) throw new Error('No audio data provided');

    const binaryStr = atob(audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Use 'unknown' for auto language detection by Sarvam AI
    const langCode = language === 'hi' ? 'hi-IN' : language === 'en' ? 'en-IN' : 'unknown';
    // Always pass 'unknown' to let Sarvam auto-detect the actual spoken language
    const detectLangCode = 'unknown';

    console.log(`🎤 STT request (${keys.length} keys in pool)`);

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const apiKey = getNextSarvamKey();
      const keyLabel = `SARVAM_KEY_${(_sarvamKeyIndex) % keys.length}`;
      const start = Date.now();
      try {
        const formData = new FormData();
        const audioBlob = new Blob([bytes.buffer], { type: 'audio/webm' });
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', 'saarika:v2.5');
        formData.append('language_code', langCode);

        const response = await fetch('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: { 'api-subscription-key': apiKey },
          body: formData,
        });

        if (response.status === 429 || response.status === 403) {
          logUsage(keyLabel, 'rate_limited', String(response.status), Date.now() - start);
          console.warn(`⚠️ Sarvam STT ${keyLabel} rate limited, trying next...`);
          try { await response.text(); } catch {}
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          logUsage(keyLabel, 'error', String(response.status), Date.now() - start);
          throw new Error(`Sarvam API error: ${response.status}`);
        }

        const result = await response.json();
        logUsage(keyLabel, 'success', undefined, Date.now() - start);
        console.log(`✅ STT success (${keyLabel})`);
        return new Response(JSON.stringify({
          transcript: result.transcript || '',
          language_code: result.language_code || langCode,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        if (attempt === keys.length - 1) throw err;
        console.warn(`⚠️ Sarvam STT attempt ${attempt + 1} failed: ${err.message}`);
      }
    }
    throw new Error('All Sarvam STT keys exhausted');

  } catch (error: any) {
    console.error('STT Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
