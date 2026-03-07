import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Study AI - Ultra Advanced Gemini Chat Service
 * Developed by: Ajit Kumar
 * Version: 3.5 (Powered by Gemini 3 Flash)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class ApiKeyRotationService {
  private API_KEYS: string[] = [];
  private readonly ROTATION_INTERVAL = 10 * 60 * 1000; 
  private pools: { [feature: string]: { currentIndex: number; lastRotation: number; requestCount: number } } = {};

  constructor() {
    const raw = Deno.env.get('GEMINI_API_KEYS') || '';
    this.API_KEYS = raw.split(',').map(k => k.trim()).filter(Boolean);

    const features = ['default', 'interactive-teacher', 'interactive-quiz'];
    features.forEach(feature => {
      this.pools[feature] = {
        currentIndex: this.API_KEYS.length > 0 ? Math.floor(Math.random() * this.API_KEYS.length) : 0,
        lastRotation: Date.now(),
        requestCount: 0
      };
    });
    console.log('🔄 Rotation initialized for Study AI with', this.API_KEYS.length, 'keys');
  }

  getApiKey(feature: string = 'default'): string {
    const pool = this.pools[feature] || this.pools['default'];
    pool.requestCount++;
    if (this.API_KEYS.length === 0) throw new Error('No API keys found in secrets.');
    
    const now = Date.now();
    if ((now - pool.lastRotation > this.ROTATION_INTERVAL) || (pool.requestCount > 50)) {
      pool.currentIndex = (pool.currentIndex + 1) % this.API_KEYS.length;
      pool.lastRotation = now;
      pool.requestCount = 0;
    }
    return this.API_KEYS[pool.currentIndex];
  }

  forceRotation(feature: string): string {
    const pool = this.pools[feature] || this.pools['default'];
    pool.currentIndex = (pool.currentIndex + 1) % this.API_KEYS.length;
    pool.lastRotation = Date.now();
    pool.requestCount = 0;
    return this.API_KEYS[pool.currentIndex];
  }
}

const rotationService = new ApiKeyRotationService();

async function makeAPICallWithRetry(url: string, options: any, maxRetries: number = 3, feature: string = 'default') {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      if (response.status === 429 || response.status === 403) {
        const newKey = rotationService.forceRotation(feature);
        const urlObj = new URL(url);
        urlObj.searchParams.set('key', newKey);
        url = urlObj.toString();
        await new Promise(res => setTimeout(res, 2000));
        continue;
      }
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`API ${response.status}: ${errorData.error?.message}`);
    } catch (error) {
      lastError = error;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, history = [], apiKeyType = 'default' } = await req.json();
    if (!prompt) throw new Error('Prompt is required');

    let GEMINI_API_KEY = rotationService.getApiKey(apiKeyType);
    
    // ✅ मॉडल अपडेट: google/gemini-3-flash-preview (The Most Advanced Model)
    const API_URL = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=\${GEMINI_API_KEY}\`;

    const systemInstruction = {
      role: "user",
      parts: [{ text: "Identity: You are Study AI, built by Ajit Kumar. Style: Ultra-conversational mentor. Behavior: Smart, helpful, friend-like tone. Goal: Make learning exciting!" }]
    };

    const messages = [
      systemInstruction,
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: prompt }] }
    ];

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.75, // और भी ज्यादा नेचुरल बातचीत के लिए
          topP: 0.95,
          maxOutputTokens: 4096, // आउटपुट टोकन्स बढ़ाए गए हैं ताकि नोट्स और प्लान्स कटें नहीं
        }
      }),
    };

    const response = await makeAPICallWithRetry(API_URL, requestOptions, 3, apiKeyType);
    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI response format error.");
    }
    
    const responseText = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: responseText, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
