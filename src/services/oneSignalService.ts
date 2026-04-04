import { supabase } from '@/integrations/supabase/client';

const ONE_SIGNAL_SCRIPT_ID = 'onesignal-sdk';
const ONE_SIGNAL_LEGACY_KEY = 'study_ai_onesignal_legacy_external_ids';
const ONE_SIGNAL_CURRENT_KEY = 'study_ai_onesignal_current_external_id';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

function getOneSignalAppId(): string {
  return import.meta.env.VITE_ONESIGNAL_APP_ID || '';
}

function loadOneSignalScript(): Promise<void> {
  if (document.getElementById(ONE_SIGNAL_SCRIPT_ID)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = ONE_SIGNAL_SCRIPT_ID;
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
    document.head.appendChild(script);
  });
}

export async function initOneSignal(): Promise<void> {
  const appId = getOneSignalAppId();
  if (!appId || typeof window === 'undefined') return;

  await loadOneSignalScript();

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({ appId, allowLocalhostAsSecureOrigin: true });
  });
}

export async function loginToOneSignal(userId: string): Promise<void> {
  if (!userId || typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.login(userId);
  });
}

export async function logoutOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    if (OneSignal.logout) await OneSignal.logout();
  });
}

function getLegacyExternalIds(currentUserId: string): string[] {
  const oldCurrent = localStorage.getItem(ONE_SIGNAL_CURRENT_KEY);
  const legacyRaw = localStorage.getItem(ONE_SIGNAL_LEGACY_KEY);
  const legacy = legacyRaw ? JSON.parse(legacyRaw) as string[] : [];

  const merged = new Set<string>(legacy.filter(Boolean));
  if (oldCurrent && oldCurrent !== currentUserId) merged.add(oldCurrent);

  return Array.from(merged).filter((id) => id !== currentUserId);
}

function persistIdentityState(currentUserId: string, legacyIds: string[]): void {
  localStorage.setItem(ONE_SIGNAL_CURRENT_KEY, currentUserId);
  localStorage.setItem(ONE_SIGNAL_LEGACY_KEY, JSON.stringify(legacyIds));
}

export async function syncOneSignalIdentity(currentUserId: string): Promise<void> {
  if (!currentUserId) return;

  const legacyExternalIds = getLegacyExternalIds(currentUserId);

  await loginToOneSignal(currentUserId);

  try {
    await supabase.functions.invoke('onesignal-identity-sync', {
      body: {
        current_user_id: currentUserId,
        legacy_external_ids: legacyExternalIds,
      },
    });

    persistIdentityState(currentUserId, []);
  } catch {
    persistIdentityState(currentUserId, legacyExternalIds);
  }
}

export async function sendPushNotificationFromClient(params: {
  user_id: string;
  title: string;
  message: string;
  scheduled_time?: string;
}): Promise<void> {
  await supabase.functions.invoke('send-push-notification', { body: params });
}
