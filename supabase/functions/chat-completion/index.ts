
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

// ─── Configuration ──────────────────────────────────────────
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const API_CALL_TIMEOUT_MS = 8000; // Increased timeout to 8 seconds for larger payloads
const FAILURE_THRESHOLD = 3;
const COOL_OFF_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
const PROVIDER_RACE_COUNT = 2; // Race the top 2 providers

interface ApiProvider {
  name: string;
  health_score: number;
  consecutive_failures: number;
  circuit_state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  last_failure_at: string | null;
  url: string;
  apiKey: string;
  model?: string;
}

// ─── Utilities ──────────────────────────────────────────────
const jsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
class AiProviderError extends Error { constructor(message: string) { super(message); this.name = 'AiProviderError'; } }

// ─── [USER-DESIGNED] Health & Circuit Breaker Logic ───────────

async function getInitialProviders(): Promise<Partial<ApiProvider>[]> {
    const providers: Partial<ApiProvider>[] = [];
    const env = Deno.env.toObject();
    for (const key in env) {
        if (key.startsWith('GOOGLE_API_KEY')) {
            providers.push({ name: `google_${key.replace('GOOGLE_API_KEY', '').replace('_', '') || 'base'}`, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', apiKey: env[key], model: 'gemini-1.5-flash' });
        }
    }
    if (env.OPENROUTER_API_KEY) providers.push({ name: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', apiKey: env.OPENROUTER_API_KEY, model: 'google/gemini-pro' });
    if (env.LOVABLE_API_KEY) providers.push({ name: 'lovable', url: 'https://ai.gateway.lovable.dev/v1/chat/completions', apiKey: env.LOVABLE_API_KEY });
    return providers;
}

async function getLiveProviderStatus(supabase: SupabaseClient): Promise<ApiProvider[]> {
    const initialProviders = await getInitialProviders();
    const { data: healthData, error } = await supabase.from('api_provider_health').select('*');
    if (error) {
        console.error("DB Error fetching health:", error);
        return initialProviders.map(p => ({ ...p, health_score: 100, consecutive_failures: 0, circuit_state: 'CLOSED', last_failure_at: null } as ApiProvider));
    }

    const liveProviders: ApiProvider[] = [];
    const providersToUpsert: any[] = [];
    for (const p of initialProviders) {
        let status = healthData.find(h => h.name === p.name);
        if (!status) {
            status = { name: p.name, health_score: 100, consecutive_failures: 0, circuit_state: 'CLOSED', last_failure_at: null };
            providersToUpsert.push(status);
        } else if (status.circuit_state === 'OPEN' && new Date().getTime() - new Date(status.last_failure_at).getTime() > COOL_OFF_PERIOD_MS) {
            status.circuit_state = 'HALF_OPEN';
            providersToUpsert.push({ name: status.name, circuit_state: 'HALF_OPEN' });
        }
        liveProviders.push({ ...p, ...status } as ApiProvider);
    }
    if (providersToUpsert.length > 0) {
        await supabase.from('api_provider_health').upsert(providersToUpsert, { onConflict: 'name' });
    }
    return liveProviders;
}

async function updateProviderHealth(supabase: SupabaseClient, providerName: string, outcome: 'success' | 'failure') {
    try {
        const { data } = await supabase.from('api_provider_health').select('health_score, consecutive_failures').eq('name', providerName).single();
        if (!data) return;

        let update: any;
        if (outcome === 'success') {
            update = { health_score: Math.min(100, data.health_score + 2), consecutive_failures: 0, circuit_state: 'CLOSED' };
        } else {
            const newFailures = data.consecutive_failures + 1;
            update = {
                health_score: Math.max(0, data.health_score - 20),
                consecutive_failures: newFailures,
                last_failure_at: new Date().toISOString(),
                circuit_state: newFailures >= FAILURE_THRESHOLD ? 'OPEN' : 'CLOSED'
            };
            if (update.circuit_state === 'OPEN') console.warn(`CIRCUIT OPEN for ${providerName}`);
        }
        await supabase.from('api_provider_health').update(update).eq('name', providerName);
    } catch (dbError) { console.error(`DB Error updating health for ${providerName}:`, dbError); }
}

// ─── Main Handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const serviceRoleClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { prompt, history = [], imageBase64 } = await req.json();

    // --- Build Messages (common for all providers) ---
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
    const { data: { user } } = await userClient.auth.getUser();
    let memoriesContext = '';
    if (user) {
        try {
            const { data: memories } = await userClient.from('user_memories').select('memory_key,memory_value').eq('user_id', user.id).order('importance', { ascending: false }).limit(15);
            if (memories?.length) memoriesContext = `\n\n🧠 **Mind Vault — इस यूजर के बारे में याद रखें:**\n${memories.map((m:any) => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
        } catch (e) { console.warn('⚠️ Failed to load memories:', e); }
    }
    const systemContent = `आप 'Study AI' हैं, जिसे अजित कुमार (Ajit Kumar) ने बनाया है। आप एक दोस्त और मेंटोर हैं। बातचीत में सरल Hindi-English भाषा का प्रयोग करें, हमेशा उत्साहित और मददगार रहें। यूजर की personal जानकारी (नाम, लक्ष्य, आदि) का प्रयोग करें जो 🧠 Mind Vault में दी गई है।${memoriesContext}`;
    const mappedHistory = history.map((msg: {role: string, content: string}) => ({ role: msg.role === 'bot' ? 'assistant' : msg.role, content: msg.content }));
    const userContent: any = imageBase64 ? [{ type: 'text', text: prompt || 'Image analyze करो' }, { type: 'image_url', image_url: { url: imageBase64 } }] : prompt;
    const messages = [{ role: 'system', content: systemContent }, ...mappedHistory.slice(-30), { role: 'user', content: userContent }];

    // --- [NEW] Parallel Racing Logic ---
    const providers = await getLiveProviderStatus(serviceRoleClient);
    const healthyProviders = providers.filter(p => p.circuit_state === 'CLOSED' || p.circuit_state === 'HALF_OPEN').sort((a, b) => b.health_score - a.health_score);

    if (healthyProviders.length === 0) throw new AiProviderError('All AI providers are temporarily down. Please try again in 5 minutes.');

    const providersToRace = healthyProviders.slice(0, PROVIDER_RACE_COUNT);
    
    const callProvider = (provider: ApiProvider): Promise<{ response: Response; provider: ApiProvider }> => {
        return new Promise(async (resolve, reject) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT_MS);
            try {
                const response = await fetch(provider.url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: provider.model || 'gemini-1.5-flash', messages, temperature: 0.7, max_tokens: 8000 }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    const errorBody = await response.text();
                    reject({ error: new Error(`API error ${response.status}: ${errorBody.substring(0, 200)}`), provider });
                } else {
                    resolve({ response, provider });
                }
            } catch (error) {
                clearTimeout(timeoutId);
                reject({ error, provider });
            }
        });
    };

    try {
        const racePromises = providersToRace.map(p => callProvider(p));
        const winner = await Promise.any(racePromises);

        console.log(`🏆 Race winner: ${winner.provider.name} (Score: ${winner.provider.health_score})`);
        updateProviderHealth(serviceRoleClient, winner.provider.name, 'success');
        return winner.response;

    } catch (error: any) {
        console.warn(`🚨 All ${providersToRace.length} providers in the race failed.`);
        if (error instanceof AggregateError) {
            for (const individualError of error.errors) {
                if (individualError?.provider) {
                    console.warn(`- ${individualError.provider.name} failed: ${individualError.error.message}`)
                    updateProviderHealth(serviceRoleClient, individualError.provider.name, 'failure');
                }
            }
        }
        throw new AiProviderError('AI अभी थोड़ी देर के लिए busy है. सारे API Providers में दिक्कत आ रही है. 1-2 मिनट बाद फिर try करें।');
    }

  } catch (error: unknown) {
    console.error('❌ Final error in handler:', error);
    const errorMessage = error instanceof AiProviderError ? error.message : 'माफ़ करना दोस्त, कुछ तकनीकी दिक्कत आ गई है। एक बार फिर कोशिश करो!';
    return jsonResponse({ error: errorMessage }, error instanceof AiProviderError ? 429 : 500);
  }
});
