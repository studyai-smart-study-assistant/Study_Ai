import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Strip markdown formatting for cleaner TTS
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // bold
    .replace(/\*([^*]+)\*/g, '$1')        // italic
    .replace(/#{1,6}\s/g, '')             // headings
    .replace(/`([^`]+)`/g, '$1')          // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^\s*[-*+]\s+/gm, '')        // list bullets
    .replace(/^\s*\d+\.\s+/gm, '')        // numbered lists
    .replace(/\n{2,}/g, '. ')             // multiple newlines to pause
    .replace(/\n/g, ' ')                  // single newlines
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, language, voice } = await req.json();
    if (!text) {
      throw new Error('Text is required');
    }

    const sarvamApiKey = Deno.env.get('SARVAM_API_KEY');
    
    if (!sarvamApiKey) {
      return new Response(JSON.stringify({ error: 'No TTS provider configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanText = stripMarkdown(text);
    console.log(`🔊 TTS request: ${cleanText.substring(0, 80)}... (${cleanText.length} chars)`);

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Subscription-Key': sarvamApiKey,
      },
      body: JSON.stringify({
        text: cleanText,
        target_language_code: language || 'hi-IN',
        speaker: voice || 'anushka',
        model: 'bulbul:v3',
        enable_preprocessing: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam API error:', response.status, errorText);
      throw new Error(`Sarvam API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.audios && data.audios[0]) {
      return new Response(JSON.stringify({ audioContent: data.audios[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('No audio data in Sarvam response');

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ TTS error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
