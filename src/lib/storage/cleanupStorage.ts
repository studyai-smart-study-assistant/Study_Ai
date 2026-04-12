const ONE_MB = 1024 * 1024;
const APPROX_LOCALSTORAGE_LIMIT_BYTES = 5 * ONE_MB;
const CLEANUP_THRESHOLD = 0.8;
const LARGE_KEY_THRESHOLD = 500 * 1024;

const ESSENTIAL_PREFIXES = ['sb-'];
const ESSENTIAL_KEYS = new Set(['theme']);
const STALE_DAILY_KEY_RETENTION_DAYS = 21;
const ARRAY_KEY_LIMITS: Array<{ pattern: RegExp; maxItems: number }> = [
  { pattern: /_points_history$/, maxItems: 200 },
  { pattern: /_usage_data$/, maxItems: 90 },
  { pattern: /study_ai_notifications$/, maxItems: 200 },
];

export function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

export function estimateLocalStorageUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) ?? '';
    total += key.length + value.length;
  }
  return total * 2;
}

function isEssentialKey(key: string): boolean {
  if (ESSENTIAL_KEYS.has(key)) return true;
  return ESSENTIAL_PREFIXES.some(prefix => key.startsWith(prefix));
}

export function clearNonEssentialStorage(): void {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key || isEssentialKey(key)) continue;
    localStorage.removeItem(key);
  }
}

export function cleanupStorage(): void {
  pruneStaleDailyKeys();
  pruneOversizedJsonArrays();

  const usage = estimateLocalStorageUsage();
  if (usage < APPROX_LOCALSTORAGE_LIMIT_BYTES * CLEANUP_THRESHOLD) return;

  localStorage.removeItem('Youtube_cache');

  const removableKeys: Array<{ key: string; size: number }> = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || isEssentialKey(key)) continue;
    const value = localStorage.getItem(key) ?? '';
    const size = (key.length + value.length) * 2;
    if (size >= LARGE_KEY_THRESHOLD) {
      removableKeys.push({ key, size });
    }
  }

  removableKeys
    .sort((a, b) => b.size - a.size)
    .forEach(({ key }) => localStorage.removeItem(key));
}

function pruneStaleDailyKeys(): void {
  const now = Date.now();
  const retentionMs = STALE_DAILY_KEY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const dailyKeyRegex = /_(daily_problems|completed_problems)_(\d{4}-\d{2}-\d{2})$/;

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key || isEssentialKey(key)) continue;
    const match = key.match(dailyKeyRegex);
    if (!match) continue;

    const date = new Date(match[2]).getTime();
    if (Number.isNaN(date)) continue;
    if (now - date > retentionMs) {
      localStorage.removeItem(key);
    }
  }
}

function pruneOversizedJsonArrays(): void {
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || isEssentialKey(key)) continue;

    const rule = ARRAY_KEY_LIMITS.find(({ pattern }) => pattern.test(key));
    if (!rule) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length <= rule.maxItems) continue;
      const trimmed = parsed.slice(-rule.maxItems);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      // Ignore malformed JSON.
    }
  }
}
