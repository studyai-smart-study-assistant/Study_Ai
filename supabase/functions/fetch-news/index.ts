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

    // Build URL
    let url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=in&language=hi,en`;

    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }

    if (category && category.trim()) {
      url += `&category=${encodeURIComponent(category.trim())}`;
    }

    console.log('Fetching news from:', url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.results?.message || 'News fetch failed');
    }

    // Format results
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
