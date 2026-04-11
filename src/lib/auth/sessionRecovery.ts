import { supabase } from '@/integrations/supabase/client';
import { cleanupStorage, clearNonEssentialStorage, isQuotaExceededError } from '@/lib/storage/cleanupStorage';

let isHandlingAuthFailure = false;

export async function refreshSessionOrLogout(redirectToLogin = true): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw error ?? new Error('Session refresh failed');
    }
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn('Storage full, clearing cache...');
      cleanupStorage();
      clearNonEssentialStorage();
      alert('Storage full, clearing cache...');
    }

    await supabase.auth.signOut({ scope: 'local' });
    if (redirectToLogin && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    return false;
  }
}

export function installFetchInterceptor(): void {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await nativeFetch(input, init);
    if ((response.status === 401 || response.status === 403) && !isHandlingAuthFailure) {
      isHandlingAuthFailure = true;
      try {
        await refreshSessionOrLogout(true);
      } finally {
        isHandlingAuthFailure = false;
      }
    }
    return response;
  };
}
