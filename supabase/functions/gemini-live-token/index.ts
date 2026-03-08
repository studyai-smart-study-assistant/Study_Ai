import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FALLBACK_LIVE_MODELS = [
  'models/gemini-2.5-flash-native-audio-latest',
  'models/gemini-live-2.5-flash-preview',
  'models/gemini-2.0-flash-live-001',
  'models/gemini-2.0-flash-exp',
];

function uniqueModels(models: string[]) {
  return Array.from(new Set(models.filter(Boolean)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Collect all Google API keys for rotation
    const allKeys: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const k = Deno.env.get(`GOOGLE_API_KEY_${i}`);
      if (k) allKeys.push(k);
    }
    const baseKey = Deno.env.get('GOOGLE_API_KEY');
    if (baseKey) allKeys.push(baseKey);
    const keys = [...new Set(allKeys)];
    
    if (keys.length === 0) throw new Error('No GOOGLE_API_KEY configured');

    // Pick key via round-robin (time-based for stateless rotation)
    const keyIndex = Math.floor(Date.now() / 1000) % keys.length;
    const GOOGLE_API_KEY = keys[keyIndex];

    let discovered: string[] = [];

    try {
      const modelsResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`);
      if (modelsResp.ok) {
        const modelsData = await modelsResp.json();
        const models = Array.isArray(modelsData?.models) ? modelsData.models : [];

        discovered = models
          .filter((m: any) =>
            Array.isArray(m?.supportedGenerationMethods) &&
            m.supportedGenerationMethods.some((method: string) =>
              method?.toLowerCase?.() === 'bidigeneratecontent'
            )
          )
          .map((m: any) => (m?.name || '').trim())
          .filter(Boolean);
      }
    } catch (modelError) {
      console.warn('Model discovery failed, using fallback model list:', modelError);
    }

    const orderedModels = uniqueModels([
      discovered.find((name) => name.endsWith('gemini-2.5-flash-native-audio-latest')) || '',
      discovered.find((name) => name.endsWith('gemini-live-2.5-flash-preview')) || '',
      discovered.find((name) => name.endsWith('gemini-2.0-flash-live-001')) || '',
      discovered.find((name) => name.endsWith('gemini-2.0-flash-exp')) || '',
      ...discovered,
      ...FALLBACK_LIVE_MODELS,
    ]);

    const selectedModel = orderedModels[0] || FALLBACK_LIVE_MODELS[0];

    return new Response(JSON.stringify({
      apiKey: GOOGLE_API_KEY,
      allKeys: keys, // Send all keys so frontend can rotate on 429
      model: selectedModel,
      models: orderedModels,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
