import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CHUNK_SIZE = 450;
const MAX_RETRIES = 2;

function cleanMarkdownForTTS(text: string): string {
  let clean = text;
  clean = clean.replace(/```[\s\S]*?```/g, '');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
  clean = clean.replace(/\*([^*]+)\*/g, '$1');
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  clean = clean.replace(/\|([^|\n]+)\|/g, (_, content) => {
    return content.split('|').map((c: string) => c.trim()).filter((c: string) => c && !c.match(/^[-:]+$/)).join(' ') + '. ';
  });
  clean = clean.replace(/\n+/g, ' ');
  return clean.trim();
}

function splitIntoSentences(text: string): string[] {
  const sentenceEnders = /(?<=[.?!।])\s+/;
  return text.split(sentenceEnders).filter(s => s.trim().length > 0);
}

function buildChunks(sentences: string[], maxSize: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxSize) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function callSarvamTTS(text: string, apiKey: string, language: string, retries = MAX_RETRIES): Promise<string> {
  const url = 'https://api.sarvam.ai/text-to-speech';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        body: JSON.stringify({
          input: text,
          target_language_code: language || 'hi-IN',
          speaker: 'meera',
          model: 'bulbul:v1',
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          enable_preprocessing: true,
          speech_sample_rate: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Attempt ${attempt + 1} failed: ${response.status}`, errorText);
        if (attempt === retries) throw new Error(`Sarvam Error: ${errorText}`);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      const data = await response.json();
      if (data.audio_content) {
        return data.audio_content;
      }
      // Fallback: check audios array
      if (data.audios && data.audios.length > 0) {
        return data.audios[0];
      }
      throw new Error('No audio content in response');
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error('All retries failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SARVAM_API_KEY');
    if (!apiKey) throw new Error('SARVAM_API_KEY missing');

    const { text, language = 'hi-IN' } = await req.json();
    if (!text) throw new Error('Text is required');

    const cleanText = cleanMarkdownForTTS(text);
    const sentences = splitIntoSentences(cleanText);
    const chunks = buildChunks(sentences, MAX_CHUNK_SIZE);

    console.log(`Processing ${chunks.length} chunks`);

    const audioChunks: string[] = [];
    const failedChunks: number[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const audioBase64 = await callSarvamTTS(chunks[i], apiKey, language);
        audioChunks.push(audioBase64);
      } catch (error) {
        console.error(`Chunk ${i} error:`, (error as Error).message);
        failedChunks.push(i);
      }
    }

    if (audioChunks.length === 0) throw new Error('Failed to generate any audio');

    return new Response(JSON.stringify({
      audioChunks,
      totalChunks: chunks.length,
      failedChunks,
      format: 'wav',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TTS Error:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
