import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Sarvam Key Pool ──────────────────────────
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
function getNextSarvamKey(): { key: string; label: string; index: number } {
  const keys = getSarvamApiKeys();
  if (keys.length === 0) throw new Error('No Sarvam API keys configured');
  const index = _sarvamKeyIndex % keys.length;
  const key = keys[index];
  _sarvamKeyIndex = (_sarvamKeyIndex + 1) % keys.length;
  return { key, label: `SARVAM_TTS_${index + 1}`, index };
}

async function logUsage(keyId: string, status: string, errorCode?: string, ms?: number) {
  try {
    const c = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await c.from('api_key_usage').insert({ 
      service: 'sarvam-tts', 
      key_identifier: keyId, 
      status, 
      error_code: errorCode || null, 
      response_time_ms: ms || null 
    });
  } catch {}
}

// Strip markdown formatting for cleaner TTS
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '') // remove code blocks entirely
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, language, voice } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keys = getSarvamApiKeys();
    if (keys.length === 0) {
      return new Response(JSON.stringify({ error: 'No TTS provider configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanText = stripMarkdown(text);
    if (!cleanText || cleanText.length < 2) {
      return new Response(JSON.stringify({ error: 'Text too short after cleaning' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const selectedVoice = voice || 'shubh';
    const selectedLang = language || 'hi-IN';
    
    console.log(`🔊 TTS request: "${cleanText.substring(0, 60)}..." (${cleanText.length} chars, ${keys.length} keys, voice=${selectedVoice})`);

    // Try each key with exponential backoff
    const maxAttempts = Math.min(keys.length * 2, 8);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { key: apiKey, label: keyLabel } = getNextSarvamKey();
      const start = Date.now();
      
      try {
        const response = await fetchWithTimeout('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'API-Subscription-Key': apiKey,
          },
          body: JSON.stringify({
            text: cleanText,
            target_language_code: selectedLang,
            speaker: selectedVoice,
            model: 'bulbul:v3',
            enable_preprocessing: true,
          }),
        }, 25000);

        // Handle rate limits and quota exhausted
        if (response.status === 429 || response.status === 403 || response.status === 402) {
          const errorType = response.status === 402 ? 'quota_exhausted' : 'rate_limited';
          logUsage(keyLabel, errorType, String(response.status), Date.now() - start);
          console.warn(`⚠️ TTS ${keyLabel} ${errorType} (${response.status}), trying next key...`);
          try { await response.text(); } catch {}
          // Exponential backoff
          await delay(Math.min(500 * Math.pow(2, attempt), 4000));
          continue;
        }

        // Handle server errors
        if (response.status >= 500) {
          logUsage(keyLabel, 'server_error', String(response.status), Date.now() - start);
          console.warn(`⚠️ TTS ${keyLabel} server error (${response.status}), retrying...`);
          try { await response.text(); } catch {}
          await delay(1000);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          logUsage(keyLabel, 'error', String(response.status), Date.now() - start);
          console.error(`❌ TTS ${keyLabel} error: ${response.status} - ${errorText}`);
          lastError = new Error(`Sarvam TTS error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.audios && data.audios[0]) {
          logUsage(keyLabel, 'success', undefined, Date.now() - start);
          console.log(`✅ TTS success (${keyLabel}, ${Date.now() - start}ms)`);
          return new Response(JSON.stringify({ audioContent: data.audios[0] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // No audio in response
        logUsage(keyLabel, 'empty_response', 'NO_AUDIO', Date.now() - start);
        console.warn(`⚠️ TTS ${keyLabel}: No audio in response, retrying...`);
        continue;

      } catch (err: unknown) {
        const error = err as Error;
        
        if (error.name === 'AbortError') {
          logUsage(keyLabel, 'timeout', 'TIMEOUT', Date.now() - start);
          console.warn(`⚠️ TTS ${keyLabel} timed out, trying next key...`);
          continue;
        }
        
        lastError = error;
        console.warn(`⚠️ TTS attempt ${attempt + 1}/${maxAttempts} failed (${keyLabel}): ${error.message}`);
        
        if (attempt < maxAttempts - 1) {
          await delay(500 * (attempt + 1));
        }
      }
    }

    // All attempts failed
    const errorMsg = lastError?.message || 'All TTS keys exhausted';
    console.error('❌ TTS failed after all attempts:', errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ TTS Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
