import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { registerServiceWorker } from './lib/register-sw';
import { AuthProvider } from './providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import { cleanupStorage, isQuotaExceededError } from './lib/storage/cleanupStorage';
import { installFetchInterceptor } from './lib/auth/sessionRecovery';

const GUEST_PURGE_FLAG = 'studyai_guest_storage_purged_once';
const GUEST_ALLOWED_LOCAL_KEYS = new Set(['theme']);
const MAX_GUEST_VALUE_LENGTH = 100 * 1024;

function hasSupabaseSessionToken(): boolean {
  return Object.keys(sessionStorage).some((key) => key.startsWith('sb-'));
}

function purgeGuestStorageOnce(): void {
  if (sessionStorage.getItem(GUEST_PURGE_FLAG) === '1') return;

  if (!hasSupabaseSessionToken()) {
    localStorage.clear();
  }

  sessionStorage.setItem(GUEST_PURGE_FLAG, '1');
}

function installLocalStorageGuard(): void {
  const nativeSetItem = localStorage.setItem.bind(localStorage);

  localStorage.setItem = (key: string, value: string) => {
    const isGuest = !hasSupabaseSessionToken();

    if (isGuest && !GUEST_ALLOWED_LOCAL_KEYS.has(key)) {
      console.warn(`[storage-guard] blocked guest localStorage write: ${key}`);
      return;
    }

    if (isGuest && value.length > MAX_GUEST_VALUE_LENGTH) {
      console.warn(`[storage-guard] blocked oversized guest write: ${key} (${value.length} bytes)`);
      return;
    }

    try {
      nativeSetItem(key, value);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        cleanupStorage();
        return;
      }
      throw error;
    }
  };
}

purgeGuestStorageOnce();
installLocalStorageGuard();
cleanupStorage();
installFetchInterceptor();

registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="theme">
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
