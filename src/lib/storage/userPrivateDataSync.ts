import { supabase } from '@/integrations/supabase/client';
import { loadCloudAppData, saveCloudAppData } from '@/lib/chat/cloud-sync';

const ESSENTIAL_KEYS = new Set(['theme']);
const ESSENTIAL_PREFIXES = ['sb-'];

const SYNCABLE_KEY_PATTERNS = [
  /^studyai_/,
  /^study_ai_/,
  /_usage_data$/,
  /_points_history$/,
  /_comprehensive_activities$/,
  /_daily_problems_/,
  /_completed_problems_/,
  /_credits$/,
  /_points$/,
  /_level$/,
  /_login_streak$/,
  /_longest_streak$/,
  /_last_login$/,
];

const CLEAR_AFTER_SYNC_PATTERNS = [
  /_usage_data$/,
  /_points_history$/,
  /_comprehensive_activities$/,
  /^study_ai_notifications$/,
];

let started = false;
let inFlight: Promise<void> | null = null;
let intervalId: number | null = null;

function isEssentialKey(key: string): boolean {
  if (ESSENTIAL_KEYS.has(key)) return true;
  return ESSENTIAL_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isSyncableKey(userId: string, key: string): boolean {
  if (isEssentialKey(key)) return false;
  if (key.startsWith(`${userId}_`)) return true;
  return SYNCABLE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function shouldClearAfterSync(key: string): boolean {
  return CLEAR_AFTER_SYNC_PATTERNS.some((pattern) => pattern.test(key));
}

function collectLocalUserData(userId: string): Record<string, string> {
  const snapshot: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !isSyncableKey(userId, key)) continue;

    const value = localStorage.getItem(key);
    if (value == null) continue;
    snapshot[key] = value;
  }

  return snapshot;
}

function restoreCloudDataToLocal(appData: Record<string, string>): void {
  Object.entries(appData).forEach(([key, value]) => {
    if (isEssentialKey(key)) return;
    if (localStorage.getItem(key) !== null) return;
    localStorage.setItem(key, value);
  });
}

function freeLocalStorageAfterCloudSync(userId: string): void {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key || !isSyncableKey(userId, key)) continue;
    if (!shouldClearAfterSync(key)) continue;
    localStorage.removeItem(key);
  }
}

async function syncOnce(): Promise<void> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const cloudAppData = await loadCloudAppData();
    if (cloudAppData) {
      restoreCloudDataToLocal(cloudAppData);
    }

    const localData = collectLocalUserData(user.id);
    if (Object.keys(localData).length === 0) return;

    const merged = {
      ...(cloudAppData ?? {}),
      ...localData,
      [`${user.id}_cloud_sync_at`]: String(Date.now()),
    };

    const saved = await saveCloudAppData(merged);
    if (saved) {
      freeLocalStorageAfterCloudSync(user.id);
    }
  })()
    .catch((error) => {
      console.error('[user-private-data-sync] Sync failed:', error);
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function startUserPrivateDataSync(): void {
  if (started) return;
  started = true;

  void syncOnce();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) {
      void syncOnce();
    }
  });

  intervalId = window.setInterval(() => {
    void syncOnce();
  }, 2 * 60 * 1000);
}

export function stopUserPrivateDataSync(): void {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}
