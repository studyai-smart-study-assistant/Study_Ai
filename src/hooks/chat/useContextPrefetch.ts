
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { contextMemoryService } from '@/services/contextMemoryService';

interface PrefetchedContext {
  userContext: string;
  mindVaultContext: string;
  ready: boolean;
}

export function useContextPrefetch() {
  const [prefetched, setPrefetched] = useState<PrefetchedContext>({ userContext: '', mindVaultContext: '', ready: false });
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  const prefetchContext = useCallback(async () => {
    // Debounce: don't re-fetch within 10s
    if (fetchingRef.current || Date.now() - lastFetchRef.current < 10000) return;
    fetchingRef.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        fetchingRef.current = false;
        return;
      }

      // Parallel fetch: context memory + mind vault
      const [contextResult, mindVaultResult] = await Promise.all([
        // Local context memory
        (async () => {
          const recent = contextMemoryService.getRecentContext(userId, 10);
          if (!recent.length) return '';
          return recent.slice(-5).map(e => `User: ${e.message.slice(0, 100)} → AI: ${e.response.slice(0, 100)}`).join('\n');
        })(),
        // Mind vault from DB
        (async () => {
          try {
            const { data: memories } = await supabase
              .from('user_memories')
              .select('memory_key, memory_value')
              .eq('user_id', userId)
              .order('importance', { ascending: false })
              .limit(15);
            if (!memories?.length) return '';
            return `\n🧠 Mind Vault:\n${memories.map(m => `- ${m.memory_key}: ${m.memory_value}`).join('\n')}`;
          } catch { return ''; }
        })()
      ]);

      setPrefetched({ userContext: contextResult, mindVaultContext: mindVaultResult, ready: true });
      lastFetchRef.current = Date.now();
    } catch (e) {
      console.warn('Prefetch error:', e);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const resetPrefetch = useCallback(() => {
    setPrefetched({ userContext: '', mindVaultContext: '', ready: false });
  }, []);

  return { prefetched, prefetchContext, resetPrefetch };
}
