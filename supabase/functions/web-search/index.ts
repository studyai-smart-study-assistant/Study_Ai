import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Keywords that indicate the query needs real-time web search
const REALTIME_INDICATORS_HI = [
  'आज', 'अभी', 'ताज़ा', 'ताजा', 'लेटेस्ट', 'नया', 'नवीनतम', 'हाल', 'वर्तमान',
  '2025', '2026', '2027', 'नोटिफिकेशन', 'एडमिट कार्ड', 'रिजल्ट', 'कट ऑफ',
  'सिलेबस', 'परीक्षा तिथि', 'एग्ज़ाम डेट', 'भर्ती', 'वैकेंसी', 'खबर', 'समाचार',
  'अपडेट', 'बदलाव', 'संशोधन', 'नई पॉलिसी', 'सरकारी', 'योजना'
];

const REALTIME_INDICATORS_EN = [
  'today', 'latest', 'recent', 'current', 'new', 'now', 'breaking',
  '2025', '2026', '2027', 'notification', 'admit card', 'result', 'cutoff',
  'cut off', 'syllabus', 'exam date', 'recruitment', 'vacancy', 'news',
  'update', 'change', 'revised', 'policy', 'government', 'scheme',
  'trending', 'this year', 'this month', 'this week', 'upcoming'
];

function needsWebSearch(query: string): boolean {
  const lower = query.toLowerCase();
  return [...REALTIME_INDICATORS_HI, ...REALTIME_INDICATORS_EN].some(
    indicator => lower.includes(indicator.toLowerCase())
  );
}

// ─── Tavily Key Pool (Round-Robin) ──────────────────────────
function getTavilyApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const k = Deno.env.get(`TAVILY_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  const base = Deno.env.get('TAVILY_API_KEY');
  if (base) keys.push(base);
  return [...new Set(keys)];
}

let _tavilyIdx = 0;
function getNextTavilyKey(): string {
  const keys = getTavilyApiKeys();
  if (keys.length === 0) throw new Error('No Tavily keys');
  const key = keys[_tavilyIdx % keys.length];
  _tavilyIdx = (_tavilyIdx + 1) % keys.length;
  return key;
}

async function searchTavilyWithRotation(query: string): Promise<{ results: any[]; answer?: string }> {
  const keys = getTavilyApiKeys();
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextTavilyKey();
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey, query, search_depth: 'basic',
        include_answer: true, max_results: 5,
      }),
    });
    if (response.status === 429 || response.status === 403) {
      console.warn(`⚠️ Tavily key#${_tavilyIdx} rate limited, trying next...`);
      try { await response.text(); } catch {}
      continue;
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavily API error:', response.status, errorText);
      throw new Error(`Tavily search failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      results: (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content?.substring(0, 500),
        score: r.score,
      })),
      answer: data.answer,
    };
  }
  throw new Error('All Tavily API keys exhausted (rate limited)');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, forceSearch = false } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tavilyKeys = getTavilyApiKeys();
    if (tavilyKeys.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Web search is not configured',
        shouldSearch: false,
        sources: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-detect if search is needed
    const shouldSearch = forceSearch || needsWebSearch(query);

    if (!shouldSearch) {
      return new Response(JSON.stringify({ 
        shouldSearch: false, 
        sources: [],
        searchContext: null 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Web search triggered for: "${query.substring(0, 100)}"`);

    const searchResult = await searchTavilyWithRotation(query);

    // Build context string for AI
    const searchContext = searchResult.results.map((r, i) => 
      `[Source ${i + 1}] ${r.title}\n${r.content}\nURL: ${r.url}`
    ).join('\n\n');

    const sources = searchResult.results.map(r => ({
      title: r.title,
      url: r.url,
    }));

    console.log(`✅ Found ${sources.length} web results`);

    return new Response(JSON.stringify({
      shouldSearch: true,
      searchContext,
      sources,
      tavilyAnswer: searchResult.answer || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Web search error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      shouldSearch: false,
      sources: [],
      searchContext: null,
    }), {
      status: 200, // Return 200 so AI can still respond without search
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
