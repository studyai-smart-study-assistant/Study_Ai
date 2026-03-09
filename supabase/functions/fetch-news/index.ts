import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NEWS_API_KEY = 'pub_73fd333bfe264d079ccb31bf4981f933';

// Common Hindi-to-English keyword mapping for better search
const hindiToEnglish: Record<string, string> = {
  'शिक्षा': 'education',
  'परीक्षा': 'exam',
  'नौकरी': 'jobs',
  'सरकारी': 'government',
  'खेल': 'sports',
  'क्रिकेट': 'cricket',
  'राजनीति': 'politics',
  'बिहार': 'Bihar',
  'भारत': 'India',
  'टेक्नोलॉजी': 'technology',
  'विज्ञान': 'science',
  'स्वास्थ्य': 'health',
  'व्यापार': 'business',
  'मौसम': 'weather',
  'आज': 'today',
  'ताज़ा': 'latest',
  'खबर': 'news',
  'खबरें': 'news',
  'न्यूज़': 'news',
  'बोर्ड': 'board',
  'रिजल्ट': 'result',
  'एडमिट कार्ड': 'admit card',
  'सिलेबस': 'syllabus',
  'बजट': 'budget',
};

function translateQuery(query: string): string {
  let translated = query;
  // Check if query has Hindi characters
  const hasHindi = /[\u0900-\u097F]/.test(query);
  
  if (hasHindi) {
    // Try direct keyword mapping
    for (const [hi, en] of Object.entries(hindiToEnglish)) {
      translated = translated.replace(new RegExp(hi, 'gi'), en);
    }
    // If still mostly Hindi after mapping, strip Hindi and keep English/known terms
    if (/[\u0900-\u097F]/.test(translated)) {
      // Extract any English words that exist
      const englishWords = translated.match(/[a-zA-Z0-9]+/g);
      if (englishWords && englishWords.length > 0) {
        translated = englishWords.join(' ');
      } else {
        // Pure Hindi with no mapping found — return empty to use general news
        return '';
      }
    }
  }
  
  // Clean up extra spaces
  return translated.replace(/\s+/g, ' ').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();
    
    const baseUrl = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=in&language=hi,en`;
    
    // Translate Hindi query to English for better API results
    const translatedQuery = query ? translateQuery(query.trim()) : '';
    
    let url = baseUrl;
    if (translatedQuery) {
      url += `&q=${encodeURIComponent(translatedQuery)}`;
    }
    if (category && category.trim()) {
      url += `&category=${encodeURIComponent(category.trim())}`;
    }
    // If no query and no category, default to education
    if (!translatedQuery && !category) {
      url += `&category=education`;
    }

    console.log('Fetching news:', { original: query, translated: translatedQuery, url });
    
    let response = await fetch(url);
    let data = await response.json();

    // If query returned no results, retry with just category
    if (data.status === 'success' && (!data.results || data.results.length === 0)) {
      console.log('No results, retrying with education category...');
      const fallbackUrl = `${baseUrl}&category=education`;
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
      searchedQuery: translatedQuery || 'general education news',
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
