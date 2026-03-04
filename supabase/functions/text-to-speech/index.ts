import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-platform, x-client-runtime',
};

const MAX_CHUNK_SIZE = 450; // Sarvam performs better with smaller chunks for stability
const MAX_RETRIES = 2;

function cleanMarkdownForTTS(text: string): string {
  let clean = text;
  clean = clean.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
  clean = clean.replace(/`([^`]+)`/g, '$1'); // Inline code
  clean = clean.replace(/^#{1,6}\s+/gm, ''); // Headers
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold
  clean = clean.replace(/\*([^*]+)\*/g, '$1'); // Italic
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, ''); // Images
  clean = clean.replace(/\|([^|\n]+)\|/g, (_, content) => {
    return content.split('|').map((c: string) => c.trim()).filter((c: string) => c && !c.match(/^[-:]+$/)).join(' ') + '. ';
  });
  clean = clean.replace(/\n+/g, ' '); // New lines to spaces for smoother speech
  return clean.trim();
}

function splitIntoSentences(text: string): string[] {
  // Split at sentence boundaries: . ? ! । (Hindi Purn-viram)
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
          input: text, // Changed from 'inputs' to 'input'
          target_language_code: language || 'hi-IN',
          speaker: 'meera',
          model: 'bulbul:v1',
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          enable_preprocessing: true,
          speech_sample_rate: 8000 // Optimized for faster transmission
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Attempt ${attempt + 1} failed: ${response.status}`);
        if (attempt === retries) throw new Error(`Sarvam Error: ${errorText}`);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      const data = await response.json();
      // Corrected key: Sarvam Bulbul returns 'audio_content'
      if (data.audio_content) {
        return data.audio_content;
      }
      throw new Error('Field audio_content missing in response');
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error('All retries failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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

    // Processing sequentially to avoid hitting rate limits
    for (let i = 0; i < chunks.length; i++) {
      try {
        const audioBase64 = await callSarvamTTS(chunks[i], apiKey, language);
        audioChunks.push(audioBase64);
      } catch (error) {
        console.error(`Chunk ${i} error:`, error.message);
        failedChunks.push(i);
      }
    }

    if (audioChunks.length === 0) throw new Error('Failed to generate any audio');

    return new Response(JSON.stringify({
      audioChunks,
      totalChunks: chunks.length,
      failedChunks,
      format: 'wav'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Final Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});        body: JSON.stringify({
          inputs: [text],
          target_language_code: language || 'hi-IN',
          speaker: 'meera',
          model: 'bulbul:v1',
          enable_preprocessing: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sarvam API error (attempt ${attempt + 1}):`, response.status, errorText);
        if (attempt === retries) throw new Error(`Sarvam API failed: ${response.status} - ${errorText}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      const data = await response.json();
      // Sarvam returns base64 audio in audios array
      if (data.audios && data.audios.length > 0) {
        return data.audios[0];
      }
      throw new Error('No audio in response');
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('All retries failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SARVAM_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'SARVAM_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text, language = 'hi-IN' } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Clean markdown
    const cleanText = cleanMarkdownForTTS(text);
    
    // Step 2: Split into sentences
    const sentences = splitIntoSentences(cleanText);
    
    // Step 3: Build chunks
    const chunks = buildChunks(sentences, MAX_CHUNK_SIZE);
    
    console.log(`Processing ${chunks.length} chunks for TTS`);

    // Step 4: Process chunks sequentially
    const audioChunks: string[] = [];
    const failedChunks: number[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const audioBase64 = await callSarvamTTS(chunks[i], apiKey, language);
        audioChunks.push(audioBase64);
      } catch (error) {
        console.error(`Chunk ${i} failed:`, error);
        failedChunks.push(i);
      }
    }

    if (audioChunks.length === 0) {
      return new Response(JSON.stringify({ error: 'All audio chunks failed to generate' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      audioChunks,
      totalChunks: chunks.length,
      failedChunks,
      format: 'wav',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
