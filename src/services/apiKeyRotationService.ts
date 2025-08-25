import { supabase } from "@/integrations/supabase/client";

interface ApiKeyPool {
  keys: string[];
  currentIndex: number;
  lastRotation: number;
  provider: string;
  endpoint: string;
  model: string;
}

interface ProviderConfig {
  endpoint: string;
  model: string;
  authHeader: (key: string) => { [key: string]: string };
  requestFormat: (prompt: string, history: any[]) => any;
}

interface ApiResponse {
  success: boolean;
  response?: string;
  error?: string;
  provider: string;
  model: string;
  keyUsed: string;
}

class ApiKeyRotationService {
  private static instance: ApiKeyRotationService;
  
  // API keys removed from frontend; keys are stored securely in Supabase Edge Function secrets
  private readonly PROVIDER_KEYS = {
    gemini: [],
    kluster: [],
    deepseek: [],
    openai: []
  };

  // Provider configurations
  private readonly PROVIDERS: { [key: string]: ProviderConfig } = {
    gemini: {
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      model: "gemini-2.0-flash",
      authHeader: (key: string) => ({ "X-goog-api-key": key }),
      requestFormat: (prompt: string, history: any[]) => ({
        contents: [
          ...history.map(msg => ({
            parts: [{ text: msg.content }],
            role: msg.role === 'user' ? 'user' : 'model'
          })),
          { parts: [{ text: prompt }] }
        ]
      })
    },
    kluster: {
      endpoint: "https://api.kluster.ai/v1/chat/completions",
      model: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
      authHeader: (key: string) => ({ "Authorization": `Bearer ${key}` }),
      requestFormat: (prompt: string, history: any[]) => ({
        model: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          ...history,
          { role: "user", content: prompt }
        ]
      })
    },
    deepseek: {
      endpoint: "https://api.deepseek.com/chat/completions",
      model: "deepseek-chat",
      authHeader: (key: string) => ({ "Authorization": `Bearer ${key}` }),
      requestFormat: (prompt: string, history: any[]) => ({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...history,
          { role: "user", content: prompt }
        ],
        stream: false
      })
    },
    openai: {
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      authHeader: (key: string) => ({ "Authorization": `Bearer ${key}` }),
      requestFormat: (prompt: string, history: any[]) => ({
        model: "gpt-4o-mini",
        messages: [
          ...history,
          { role: "user", content: prompt }
        ],
        store: true
      })
    }
  };

  // Rotation interval (5 minutes = 300000ms)
  private readonly ROTATION_INTERVAL = 5 * 60 * 1000;
  
  // Provider preference order (fastest to slowest)
  private readonly PROVIDER_PRIORITY = ['gemini', 'openai', 'deepseek', 'kluster'];

  private pools: { [feature: string]: ApiKeyPool[] } = {};
  private currentProviderIndex: { [feature: string]: number } = {};

  private constructor() {
    this.initializePools();
  }

  static getInstance(): ApiKeyRotationService {
    if (!ApiKeyRotationService.instance) {
      ApiKeyRotationService.instance = new ApiKeyRotationService();
    }
    return ApiKeyRotationService.instance;
  }

  private initializePools(): void {
    const features = ['default', 'interactive-teacher', 'interactive-quiz'];
    
    features.forEach(feature => {
      this.pools[feature] = [];
      this.currentProviderIndex[feature] = 0;
      
      // Create pools for each provider
      this.PROVIDER_PRIORITY.forEach(provider => {
        const keys = this.PROVIDER_KEYS[provider as keyof typeof this.PROVIDER_KEYS];
        const config = this.PROVIDERS[provider];
        
        this.pools[feature].push({
          keys: [...keys],
          currentIndex: Math.floor(Math.random() * keys.length),
          lastRotation: Date.now(),
          provider,
          endpoint: config.endpoint,
          model: config.model
        });
      });
    });

    const totalKeys = Object.values(this.PROVIDER_KEYS).reduce((sum, keys) => sum + keys.length, 0);
    console.log('🚀 Multi-Provider API Key rotation service initialized with', totalKeys, 'keys across', this.PROVIDER_PRIORITY.length, 'providers');
  }

  // Get best available API configuration
  getBestApiConfig(feature: 'default' | 'interactive-teacher' | 'interactive-quiz' = 'default'): {
    key: string;
    endpoint: string;
    authHeader: { [key: string]: string };
    requestFormat: (prompt: string, history: any[]) => any;
    provider: string;
    model: string;
  } {
    const pools = this.pools[feature];
    
    if (!pools) {
      console.warn(`⚠️ Unknown feature: ${feature}, using default pool`);
      return this.getBestApiConfig('default');
    }

    const now = Date.now();
    let currentProviderIdx = this.currentProviderIndex[feature];
    
    // Try current provider first
    let pool = pools[currentProviderIdx];
    
    // Check if rotation is needed
    if (now - pool.lastRotation > this.ROTATION_INTERVAL) {
      this.rotateKey(feature, currentProviderIdx);
    }

    const currentKey = pool.keys[pool.currentIndex];
    const config = this.PROVIDERS[pool.provider];
    const keyPreview = currentKey.substring(0, 12) + '...';
    
    console.log(`🔑 Using ${pool.provider} API key for ${feature}: ${keyPreview} (Index: ${pool.currentIndex})`);
    
    return {
      key: currentKey,
      endpoint: pool.endpoint,
      authHeader: config.authHeader(currentKey),
      requestFormat: config.requestFormat,
      provider: pool.provider,
      model: pool.model
    };
  }

  // Make API request via Supabase Edge Function (secure)
  async makeApiRequest(prompt: string, history: any[] = [], feature: 'default' | 'interactive-teacher' | 'interactive-quiz' = 'default'): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt, history, apiKeyType: feature }
      });

      if (error) throw error;
      if (!data?.response) {
        throw new Error(data?.error || 'Empty response from edge function');
      }

      return {
        success: true,
        response: data.response,
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        keyUsed: data.keyUsed || 'hidden'
      };
    } catch (err: any) {
      console.error('Edge function call failed:', err?.message || err);
      return {
        success: false,
        error: err?.message || 'Edge function error',
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        keyUsed: 'hidden'
      };
    }
  }

  // Manually rotate to next key within current provider
  private rotateKey(feature: string, providerIndex: number): void {
    const pool = this.pools[feature][providerIndex];
    if (!pool) return;

    const oldIndex = pool.currentIndex;
    pool.currentIndex = (pool.currentIndex + 1) % pool.keys.length;
    pool.lastRotation = Date.now();

    console.log(`🔄 Rotated ${pool.provider} key for ${feature}: ${oldIndex} → ${pool.currentIndex}`);
  }

  // Switch to next provider
  private switchToNextProvider(feature: string): void {
    const pools = this.pools[feature];
    const oldProvider = this.PROVIDER_PRIORITY[this.currentProviderIndex[feature]];
    
    this.currentProviderIndex[feature] = (this.currentProviderIndex[feature] + 1) % pools.length;
    const newProvider = this.PROVIDER_PRIORITY[this.currentProviderIndex[feature]];
    
    console.log(`🔀 Switching provider for ${feature}: ${oldProvider} → ${newProvider}`);
  }

  // Force rotation for a specific feature
  forceRotation(feature: 'default' | 'interactive-teacher' | 'interactive-quiz'): void {
    console.log(`⚡ Force rotating for: ${feature}`);
    this.switchToNextProvider(feature);
  }

  // Get rotation stats
  getRotationStats(): { [feature: string]: any } {
    const stats: { [feature: string]: any } = {};
    
    Object.keys(this.pools).forEach(feature => {
      const pools = this.pools[feature];
      const currentProvider = this.PROVIDER_PRIORITY[this.currentProviderIndex[feature]];
      
      stats[feature] = {
        currentProvider,
        providers: pools.map(pool => ({
          provider: pool.provider,
          currentKeyIndex: pool.currentIndex,
          totalKeys: pool.keys.length,
          timeSinceRotation: Date.now() - pool.lastRotation
        }))
      };
    });

    return stats;
  }

  // Get time until next rotation for current provider
  getTimeUntilRotation(feature: string): number {
    const pool = this.pools[feature]?.[this.currentProviderIndex[feature]];
    if (!pool) return 0;

    const elapsed = Date.now() - pool.lastRotation;
    return Math.max(0, this.ROTATION_INTERVAL - elapsed);
  }

  // Get total number of available API keys
  getTotalKeys(): number {
    return Object.values(this.PROVIDER_KEYS).reduce((sum, keys) => sum + keys.length, 0);
  }

  // Get provider health status
  getProviderHealth(): { [provider: string]: boolean } {
    // This could be enhanced to track actual success/failure rates
    return this.PROVIDER_PRIORITY.reduce((health, provider) => {
      health[provider] = true; // Default to healthy
      return health;
    }, {} as { [provider: string]: boolean });
  }
}

// Export singleton instance
export const apiKeyRotationService = ApiKeyRotationService.getInstance();