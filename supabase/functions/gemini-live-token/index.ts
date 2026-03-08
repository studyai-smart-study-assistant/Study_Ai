import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FALLBACK_LIVE_MODELS = [
  'models/gemini-2.0-flash-live-001',
  'models/gemini-2.0-flash-exp',
  'models/gemini-live-2.5-flash-preview',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not configured');

    let selectedModel = FALLBACK_LIVE_MODELS[0];

    try {
      const modelsResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`);
      if (modelsResp.ok) {
        const modelsData = await modelsResp.json();
        const models = Array.isArray(modelsData?.models) ? modelsData.models : [];

        const liveCapable = models.filter((m: any) =>
          Array.isArray(m?.supportedGenerationMethods) &&
          m.supportedGenerationMethods.some((method: string) =>
            method?.toLowerCase?.() === 'bidigeneratecontent'
          )
        );

        if (liveCapable.length > 0) {
          const names = liveCapable
            .map((m: any) => (m?.name || '').trim())
            .filter((name: string) => !!name);

          // Prefer known stable order, else first live-capable model returned by API
          selectedModel =
            names.find((name: string) => name.endsWith('gemini-2.0-flash-live-001')) ||
            names.find((name: string) => name.endsWith('gemini-2.0-flash-exp')) ||
            names[0] ||
            selectedModel;
        }
      }
    } catch (modelError) {
      console.warn('Model discovery failed, using fallback model:', modelError);
    }

    return new Response(JSON.stringify({ apiKey: GOOGLE_API_KEY, model: selectedModel }), {
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
