import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEWS_API_KEY = 'pub_73fd333bfe264d079ccb31bf4981f933';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();

    // Build URL — try with query first, fallback to general if empty
    const baseUrl = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=in&language=hi,en`;
    
    let url = baseUrl;
    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }
    if (category && category.trim()) {
      url += `&category=${encodeURIComponent(category.trim())}`;
    }

    console.log('Fetching news from:', url);
    let response = await fetch(url);
    let data = await response.json();

    // If query returned no results, retry without query (general news)
    if (data.status === 'success' && (!data.results || data.results.length === 0) && query) {
      console.log('No results with query, retrying general news...');
      let fallbackUrl = baseUrl;
      if (category && category.trim()) {
        fallbackUrl += `&category=${encodeURIComponent(category.trim())}`;
      } else {
        fallbackUrl += `&category=education`;
      }
      response = await fetch(fallbackUrl);
      data = await response.json();
    }

    if (data.status !== 'success') {
      throw new Error(data.results?.message || 'News fetch failed');
    }

    const articles = (data.results || []).slice(0, 10).map((article: any) => ({
      title: article.title || 'No title',
      description: article.description || article.content?.slice(0, 200) || '',
      url: article.link || '',
      source: article.source_name || article.source_id || 'Unknown',
      imageUrl: article.image_url || null,
      pubDate: article.pubDate || null,
      category: article.category || [],
    }));

    return new Response(JSON.stringify({
      success: true,
      articles,
      totalResults: data.totalResults || articles.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('News fetch error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch news',
      articles: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
