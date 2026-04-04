import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Study AI - Deep Thinking Mode
 * Multi-angle Tavily search + Gemini advanced synthesis
 * Built by: Ajit Kumar
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type TavilyResult = {
  title: string;
  url: string;
  content?: string;
  published_date?: string;
  score?: number;
};

type TavilySearchResponse = {
  results?: TavilyResult[];
  answer?: string;
};

type ChatHistoryItem = { role: string; content: string };
type ChatCompletionResponse = { choices?: Array<{ message?: { content?: string } }> };

// ─── Tavily Key Pool (Round-Robin) ──────────────────────────
function getTavilyApiKeys(): string[] {
  const keys: string[] = [];
  const base = Deno.env.get('TAVILY_API_KEY');
  if (base) keys.push(base);
  for (let i = 1; i <= 5; i++) {
    const k = Deno.env.get(`TAVILY_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return [...new Set(keys)];
}

let _tavilyIdx = 0;
function getNextTavilyKey(keys: string[]): string {
  if (keys.length === 0) throw new Error('No Tavily API keys configured');
  const key = keys[_tavilyIdx % keys.length];
  _tavilyIdx = (_tavilyIdx + 1) % keys.length;
  return key;
}

async function searchTavily(
  query: string,
  keys: string[],
  depth: 'basic' | 'advanced' = 'advanced',
  maxResults = 8
): Promise<{ results: TavilyResult[]; answer?: string }> {
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextTavilyKey(keys);
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: depth,
          include_answer: true,
          include_raw_content: false,
          max_results: maxResults,
        }),
      });

      if (response.status === 429 || response.status === 403) {
        console.warn(`⚠️ Tavily key rate limited, rotating...`);
        try {
          await response.text();
        } catch (readErr: unknown) {
          console.warn('Failed reading Tavily rate-limit body', readErr);
        }
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error('Tavily error:', response.status, err);
        throw new Error(`Tavily failed: ${response.status}`);
      }

      const data = await response.json() as TavilySearchResponse;
      return {
        results: (data.results || []).map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content?.substring(0, 800),
          published_date: r.published_date,
          score: r.score,
        })),
        answer: data.answer,
      };
    } catch (e: unknown) {
      if (attempt === keys.length - 1) throw e;
    }
  }
  throw new Error('All Tavily keys exhausted');
}


async function sendOneSignalNotification(params: {
  userId: string;
  title: string;
  message: string;
  scheduledTime?: string;
}): Promise<void> {
  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!appId || !restApiKey) {
    console.warn('OneSignal keys missing. Skipping push notification.');
    return;
  }

  const payload: Record<string, unknown> = {
    app_id: appId,
    include_aliases: { external_id: [params.userId] },
    target_channel: 'push',
    headings: { en: params.title, hi: params.title },
    contents: { en: params.message, hi: params.message },
  };

  if (params.scheduledTime) payload.send_after = params.scheduledTime;

  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${restApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OneSignal push failed: ${response.status} ${errorText}`);
  }
}

// Generate search sub-queries for multi-angle research
function generateSubQueries(topic: string): string[] {
  return [
    topic,                                               // Main query
    `${topic} history background origin`,               // Historical context
    `${topic} latest news 2025 updates`,                // Recent updates
    `${topic} expert opinion analysis future`,          // Expert analysis
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, history = [], user_id, notify_on_complete = false } = await req.json() as {
      topic?: string;
      history?: ChatHistoryItem[];
      user_id?: string;
      notify_on_complete?: boolean;
    };

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Topic is required', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const tavilyKeys = getTavilyApiKeys();
    console.log(`🔭 Deep Thinking started for: "${topic.substring(0, 80)}"`);

    // ── Step 1: Multi-angle Tavily searches in parallel ──────
    const subQueries = generateSubQueries(topic);
    console.log(`🔍 Running ${subQueries.length} parallel searches...`);

    const searchResults = await Promise.allSettled(
      subQueries.map((q) => searchTavily(q, tavilyKeys, 'advanced', 6))
    );

    // Aggregate all unique results
    const seenUrls = new Set<string>();
    const allResults: TavilyResult[] = [];
    const allSources: { title: string; url: string }[] = [];

    for (const result of searchResults) {
      if (result.status === 'fulfilled') {
        for (const r of result.value.results) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            allResults.push(r);
            allSources.push({ title: r.title, url: r.url });
          }
        }
      }
    }

    console.log(`✅ Collected ${allResults.length} unique sources from ${subQueries.length} searches`);

    // ── Step 2: Build comprehensive research context ──────────
    const researchContext = allResults
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 15)
      .map((r, i) =>
        `[Source ${i + 1}] ${r.title}\n${r.published_date ? `Published: ${r.published_date}\n` : ''}${r.content}\nURL: ${r.url}`
      )
      .join('\n\n---\n\n');

    // ── Step 3: Gemini Deep Analysis ──────────────────────────
    const systemPrompt = `You are Study AI's **Deep Thinking Expert** — a world-class researcher and analyst built into Study AI by Ajit Kumar.

When given a topic and real-time web research data, you provide:
1. **गहन विश्लेषण** (Deep Analysis) — not just surface-level facts
2. **Multi-perspective view** — historical, current, future outlook
3. **Expert-level insights** with specific data points, statistics
4. **Structured, markdown-formatted** response with headers, bullet points
5. **Hindi + English mix** (Hinglish) — accessible yet detailed

Your response MUST be comprehensive (700-1200 words), well-structured, and cite sources inline like [Source 1].`;

    const userMessage = `🔬 DEEP RESEARCH REQUEST: "${topic}"

Here is the real-time internet research data collected from ${allResults.length} web sources:

${researchContext}

---

Now provide an EXHAUSTIVE, EXPERT-LEVEL analysis of "${topic}" covering:
- 📚 Background / इतिहास और पृष्ठभूमि
- 📊 Current Status / वर्तमान स्थिति (with latest data from sources)
- 🔍 Key Insights / मुख्य तथ्य और विश्लेषण
- 🚀 Future Outlook / भविष्य की संभावनाएं
- 💡 Expert Opinion / विशेषज्ञ राय और निष्कर्ष

Format with clear markdown headings. Cite sources inline. Make it educational, insightful, and engaging!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Use a powerful model for deep thinking
    let aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    // Fallback to flash if pro fails
    if (!aiResponse.ok) {
      console.warn(`⚠️ Gemini Pro failed (${aiResponse.status}), falling back to flash...`);
      try {
        await aiResponse.text();
      } catch (readErr: unknown) {
        console.warn('Failed reading AI fallback response body', readErr);
      }
      
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          temperature: 0.7,
          max_tokens: 6144,
        }),
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI synthesis failed: ${aiResponse.status} — ${errText}`);
    }

    const aiData = await aiResponse.json() as ChatCompletionResponse;
    const responseText = aiData.choices?.[0]?.message?.content || 'Deep analysis could not be generated.';

    console.log(`✅ Deep Thinking complete — ${responseText.length} chars, ${allSources.length} sources`);

    if (notify_on_complete && user_id) {
      try {
        await sendOneSignalNotification({
          userId: user_id,
          title: 'Deep Thinking Complete ✅',
          message: `"${topic.substring(0, 60)}" पर आपका deep analysis तैयार है।`,
        });
      } catch (notifyError: unknown) {
        const notifyMessage = notifyError instanceof Error ? notifyError.message : String(notifyError);
        console.error('Deep Thinking push notify failed:', notifyMessage);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        sources: allSources.slice(0, 12),
        searchCount: allResults.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown deep thinking error';
    console.error('Deep Thinking error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
