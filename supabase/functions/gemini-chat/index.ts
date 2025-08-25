
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced API Key Rotation Service with better error handling
class ApiKeyRotationService {
  private API_KEYS: string[] = [];


  private readonly ROTATION_INTERVAL = 10 * 60 * 1000; // Reduced to 10 minutes
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
    console.log('🔄 Gemini API key rotation initialized with', this.API_KEYS.length, 'keys from Supabase secrets');
  }

  getApiKey(feature: string = 'default'): string {
    const pool = this.pools[feature] || this.pools['default'];
    pool.requestCount++;

    if (this.API_KEYS.length === 0) {
      throw new Error('No Gemini API keys configured in Supabase secrets (GEMINI_API_KEYS)');
    }
    
    // Check if rotation needed (time-based OR request count based)
    const now = Date.now();
    const shouldRotateByTime = now - pool.lastRotation > this.ROTATION_INTERVAL;
    const shouldRotateByCount = pool.requestCount > 50; // Rotate after 50 requests
    
    if (shouldRotateByTime || shouldRotateByCount) {
      const oldIndex = pool.currentIndex;
      pool.currentIndex = (pool.currentIndex + 1) % this.API_KEYS.length;
      pool.lastRotation = now;
      pool.requestCount = 0; // Reset count
      console.log(`🔄 Auto-rotated ${feature}: ${oldIndex} → ${pool.currentIndex} (Time: ${shouldRotateByTime}, Count: ${shouldRotateByCount})`);
    }

    const key = this.API_KEYS[pool.currentIndex];
    const preview = key ? key.substring(0, 6) + '...' : 'N/A';
    console.log(`🔑 Using key for ${feature}: ${preview} (Index: ${pool.currentIndex}, Requests: ${pool.requestCount})`);
    return key;
  }

  forceRotation(feature: string): string {
    const pool = this.pools[feature] || this.pools['default'];
    const oldIndex = pool.currentIndex;
    pool.currentIndex = (pool.currentIndex + 1) % this.API_KEYS.length;
    pool.lastRotation = Date.now();
    pool.requestCount = 0;
    console.log(`⚡ Force rotated ${feature}: ${oldIndex} → ${pool.currentIndex}`);
    return this.API_KEYS[pool.currentIndex];
  }

  // Get next available key (for multiple retry attempts)
  getNextKey(feature: string): string {
    const pool = this.pools[feature] || this.pools['default'];
    const nextIndex = (pool.currentIndex + 1) % this.API_KEYS.length;
    return this.API_KEYS[nextIndex];
  }
}

const rotationService = new ApiKeyRotationService();

// Enhanced retry logic with exponential backoff
async function makeAPICallWithRetry(url: string, options: any, maxRetries: number = 3, feature: string = 'default') {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 API Attempt ${attempt}/${maxRetries} for ${feature}`);
      
      const response = await fetch(url, options);
      
      if (response.ok) {
        console.log(`✅ API Success on attempt ${attempt}`);
        return response;
      }
      
      if (response.status === 429 || response.status === 403) {
        console.log(`🔄 Rate limit hit on attempt ${attempt}, rotating key...`);
        
        // Force rotate and update the URL for next attempt
        const newKey = rotationService.forceRotation(feature);
        const urlObj = new URL(url);
        urlObj.searchParams.set('key', newKey);
        url = urlObj.toString();
        options.headers = { ...options.headers };
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        continue;
      }
      
      // For other errors, parse and throw
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, history = [], chatId, apiKeyType = 'default' } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log(`📨 Incoming request for ${apiKeyType}, prompt length: ${prompt.length}`);

    // Get initial API key
    let GEMINI_API_KEY = rotationService.getApiKey(apiKeyType);
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Format conversation history for the API
    const messages = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add the current prompt to the history
    messages.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    console.log(`📤 Sending request to Gemini API with ${apiKeyType} key, ${messages.length} messages`);

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    };

    // Use enhanced retry logic
    const response = await makeAPICallWithRetry(API_URL, requestOptions, 3, apiKeyType);
    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid response format:', data);
      throw new Error("Invalid response format from Gemini API");
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    console.log(`✅ Successfully generated response using ${apiKeyType} key, length: ${responseText.length}`);

    return new Response(
      JSON.stringify({ 
        response: responseText,
        success: true,
        keyUsed: apiKeyType,
        responseLength: responseText.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("❌ Final error in gemini-chat function:", error);
    
    // Enhanced error response with more details
    const errorResponse = {
      error: error.message || 'Unknown error occurred',
      success: false,
      timestamp: new Date().toISOString(),
      details: error.stack ? error.stack.substring(0, 500) : 'No stack trace'
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
