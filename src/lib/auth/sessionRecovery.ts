import { supabase } from '@/integrations/supabase/client';
import { cleanupStorage, clearNonEssentialStorage, isQuotaExceededError } from '@/lib/storage/cleanupStorage';

let isFetchInterceptorInstalled = false;
let refreshInFlight: Promise<boolean> | null = null;
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

async function refreshSessionOnce(options?: RefreshSessionOptions): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSessionOrLogout(options).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function getLatestAuthHeaders(init?: RequestInit): Promise<RequestInit> {
  const headers = new Headers(init?.headers ?? {});
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return {
    ...init,
    headers,
  };
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
    let response = await nativeFetch(input, init);
    const isAuthFailure = response.status === 401 || response.status === 403;

    if (isAuthFailure && isSupabaseRequest(input)) {
      const refreshed = await refreshSessionOnce({ redirectToLogin: false, logoutOnFailure: false });

      // Retry the original request once after a successful refresh.
      if (refreshed) {
        const retryInit = await getLatestAuthHeaders(init);
        response = await nativeFetch(input, retryInit);
      }
    }
    return response;
  };
}

type FunctionInvoker<TPayload, TResult> = (payload?: TPayload) => Promise<{ data: TResult | null; error: { status?: number; message?: string } | null }>;

const isSessionFailure = (error: { status?: number; message?: string } | null | undefined): boolean =>
  Boolean(error && (error.status === 401 || error.status === 403));

export async function safeInvokeWithAuthRetry<TPayload = unknown, TResult = unknown>(
  invoke: FunctionInvoker<TPayload, TResult>,
  payload?: TPayload
): Promise<{ data: TResult | null; error: { status?: number; message?: string } | null }> {
  let result = await invoke(payload);

  if (isSessionFailure(result.error)) {
    const refreshed = await refreshSessionOnce({ redirectToLogin: false, logoutOnFailure: false });
    if (refreshed) {
      result = await invoke(payload);
    }
  }

  return result;
}
