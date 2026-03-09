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
  return { key, label: `SARVAM_STT_${index + 1}`, index };
}

async function logUsage(keyId: string, status: string, errorCode?: string, ms?: number) {
  try {
    const c = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await c.from('api_key_usage').insert({ 
      service: 'sarvam-stt', 
      key_identifier: keyId, 
      status, 
      error_code: errorCode || null, 
      response_time_ms: ms || null 
    });
  } catch {}
}

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const keys = getSarvamApiKeys();
    if (keys.length === 0) {
      return new Response(JSON.stringify({ error: 'No STT provider configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { audio, language } = await req.json();
    if (!audio) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 audio
    const binaryStr = atob(audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Auto-detect language
    const detectLangCode = 'unknown';

    console.log(`🎤 STT request (${keys.length} keys available, audio size: ${(bytes.length / 1024).toFixed(1)}KB)`);

    // Try each key with exponential backoff
    const maxAttempts = Math.min(keys.length * 2, 8);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { key: apiKey, label: keyLabel, index: keyIndex } = getNextSarvamKey();
      const start = Date.now();
      
      try {
        const formData = new FormData();
        const audioBlob = new Blob([bytes.buffer], { type: 'audio/webm' });
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', 'saarika:v2.5');
        formData.append('language_code', detectLangCode);

        const response = await fetchWithTimeout('https://api.sarvam.ai/speech-to-text', {
          method: 'POST',
          headers: { 'api-subscription-key': apiKey },
          body: formData,
        }, 30000);

        // Handle rate limits and quota
        if (response.status === 429 || response.status === 403 || response.status === 402) {
          const errorType = response.status === 402 ? 'quota_exhausted' : 'rate_limited';
          logUsage(keyLabel, errorType, String(response.status), Date.now() - start);
          console.warn(`⚠️ STT ${keyLabel} ${errorType} (${response.status}), trying next...`);
          try { await response.text(); } catch {}
          // Exponential backoff delay
          await delay(Math.min(500 * Math.pow(2, attempt), 4000));
          continue;
        }

        // Handle server errors
        if (response.status >= 500) {
          logUsage(keyLabel, 'server_error', String(response.status), Date.now() - start);
          console.warn(`⚠️ STT ${keyLabel} server error (${response.status}), retrying...`);
          try { await response.text(); } catch {}
          await delay(1000);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          logUsage(keyLabel, 'error', String(response.status), Date.now() - start);
          console.error(`❌ STT ${keyLabel} error: ${response.status} - ${errorText}`);
          lastError = new Error(`Sarvam STT error: ${response.status}`);
          continue;
        }

        const result = await response.json();
        
        if (!result.transcript && !result.text) {
          logUsage(keyLabel, 'empty_response', 'NO_TRANSCRIPT', Date.now() - start);
          console.warn(`⚠️ STT ${keyLabel}: Empty transcript, may retry...`);
          // Don't retry for empty - this is likely no speech detected
          return new Response(JSON.stringify({
            transcript: '',
            language_code: result.language_code || language || 'unknown',
            message: 'No speech detected'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        logUsage(keyLabel, 'success', undefined, Date.now() - start);
        console.log(`✅ STT success (${keyLabel}, ${Date.now() - start}ms): "${(result.transcript || result.text).substring(0, 50)}..."`);
        
        return new Response(JSON.stringify({
          transcript: result.transcript || result.text || '',
          language_code: result.language_code || language || 'unknown',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (err: unknown) {
        const error = err as Error;
        
        if (error.name === 'AbortError') {
          logUsage(keyLabel, 'timeout', 'TIMEOUT', Date.now() - start);
          console.warn(`⚠️ STT ${keyLabel} timed out, trying next...`);
          continue;
        }
        
        lastError = error;
        console.warn(`⚠️ STT attempt ${attempt + 1}/${maxAttempts} failed (${keyLabel}): ${error.message}`);
        
        if (attempt < maxAttempts - 1) {
          await delay(500 * (attempt + 1));
        }
      }
    }

    // All attempts failed
    const errorMsg = lastError?.message || 'All STT keys exhausted';
    console.error('❌ STT failed after all attempts:', errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ STT Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
