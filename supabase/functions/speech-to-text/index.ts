import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SARVAM_API_KEY = Deno.env.get('SARVAM_API_KEY');
    if (!SARVAM_API_KEY) {
      throw new Error('SARVAM_API_KEY not configured');
    }

    const { audio, language } = await req.json();
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Decode base64 audio to binary
    const binaryStr = atob(audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Determine language code for Sarvam
    const langCode = language === 'hi' ? 'hi-IN' : language === 'en' ? 'en-IN' : 'unknown';

    // Build multipart form data
    const formData = new FormData();
    const audioBlob = new Blob([bytes.buffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'saarika:v2.5');
    formData.append('language_code', langCode);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam STT error:', response.status, errorText);
      throw new Error(`Sarvam API error: ${response.status}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({ 
      transcript: result.transcript || '',
      language_code: result.language_code || langCode,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('STT Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
