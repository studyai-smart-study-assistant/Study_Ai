import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CHUNK_SIZE = 1400;
const MAX_RETRIES = 2;

// Strip markdown syntax for clean TTS
function cleanMarkdownForTTS(text: string): string {
  let clean = text;
  // Remove code blocks
  clean = clean.replace(/```[\s\S]*?```/g, '');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  // Remove headers markers but keep text
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  // Remove bold/italic markers
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
  clean = clean.replace(/\*([^*]+)\*/g, '$1');
  clean = clean.replace(/__([^_]+)__/g, '$1');
  clean = clean.replace(/_([^_]+)_/g, '$1');
  // Remove links, keep text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove images
  clean = clean.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  // Remove horizontal rules
  clean = clean.replace(/^[-*_]{3,}$/gm, '');
  // Remove blockquote markers
  clean = clean.replace(/^>\s+/gm, '');
  // Remove list markers
  clean = clean.replace(/^\s*[-*+]\s+/gm, '');
  clean = clean.replace(/^\s*\d+\.\s+/gm, '');
  // Convert tables to readable text
  clean = clean.replace(/\|([^|\n]+)\|/g, (_, content) => {
    return content.split('|').map((c: string) => c.trim()).filter((c: string) => c && !c.match(/^[-:]+$/)).join(', ') + '. ';
  });
  // Remove separator rows
  clean = clean.replace(/^[\s|:-]+$/gm, '');
  // Clean up extra whitespace
  clean = clean.replace(/\n{3,}/g, '\n\n');
  clean = clean.trim();
  return clean;
}

// Split text into sentences safely
function splitIntoSentences(text: string): string[] {
  // Split at sentence boundaries: . ? ! ।
  const sentenceEnders = /(?<=[.?!।])\s+/;
  const raw = text.split(sentenceEnders).filter(s => s.trim().length > 0);
  return raw;
}

// Build chunks from sentences respecting max size
function buildChunks(sentences: string[], maxSize: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > maxSize) {
      // Push current if exists
      if (current.trim()) {
        chunks.push(current.trim());
        current = '';
      }
      // Split long sentence at commas
      const parts = sentence.split(/(?<=,)\s+/);
      for (const part of parts) {
        if ((current + ' ' + part).length > maxSize && current.trim()) {
          chunks.push(current.trim());
          current = part;
        } else {
          current = current ? current + ' ' + part : part;
        }
      }
    } else if ((current + ' ' + sentence).length > maxSize) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// Call Sarvam API with retry
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
