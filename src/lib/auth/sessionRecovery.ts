import { supabase } from '@/integrations/supabase/client';
import { cleanupStorage, clearNonEssentialStorage, isQuotaExceededError } from '@/lib/storage/cleanupStorage';

let isHandlingAuthFailure = false;
let isFetchInterceptorInstalled = false;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type RefreshSessionOptions = {
  redirectToLogin?: boolean;
  logoutOnFailure?: boolean;
};

export async function refreshSessionOrLogout(options?: RefreshSessionOptions): Promise<boolean> {
  const redirectToLogin = options?.redirectToLogin ?? true;
  const logoutOnFailure = options?.logoutOnFailure ?? true;

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

    if (!logoutOnFailure) {
      return false;
    }

    await supabase.auth.signOut({ scope: 'local' });
    if (redirectToLogin && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    return false;
  }
}

export function installFetchInterceptor(): void {
  if (isFetchInterceptorInstalled) return;
  isFetchInterceptorInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  const isSupabaseRequest = (input: RequestInfo | URL): boolean => {
    if (!SUPABASE_URL) return false;
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    try {
      const resolvedUrl = new URL(rawUrl, window.location.origin);
      return resolvedUrl.href.startsWith(SUPABASE_URL);
    } catch {
      return false;
    }
  };

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await nativeFetch(input, init);
    const isAuthFailure = response.status === 401 || response.status === 403;

    if (isAuthFailure && isSupabaseRequest(input) && !isHandlingAuthFailure) {
      isHandlingAuthFailure = true;
      try {
        await refreshSessionOrLogout({ redirectToLogin: false, logoutOnFailure: false });
      } finally {
        isHandlingAuthFailure = false;
      }
    }
    return response;
  };
}
