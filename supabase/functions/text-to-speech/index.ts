import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();
    if (!text) {
      throw new Error('Text is required');
    }

    const selectedVoice = voice || 'hi-IN-SwaraNeural';

    // Use Sarvam AI or fallback to a simple audio response
    const sarvamApiKey = Deno.env.get('SARVAM_API_KEY');
    
    if (sarvamApiKey) {
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Subscription-Key': sarvamApiKey,
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: 'hi-IN',
          speaker: 'meera',
          model: 'bulbul:v1',
        }),
      });

      if (!response.ok) {
        throw new Error(`Sarvam API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audios && data.audios[0]) {
        const audioBuffer = Uint8Array.from(atob(data.audios[0]), c => c.charCodeAt(0));
        return new Response(audioBuffer, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/wav',
          },
        });
      }
    }

    // Return error if no TTS provider available
    return new Response(JSON.stringify({ error: 'No TTS provider configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
