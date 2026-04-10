
import { toast } from "sonner";

export const CHATS_STORE = "chats";
const STORAGE_KEY = "gemini-chat-data";
const QUOTA_PRUNE_TOAST = "बहुत अधिक चैट डेटा संग्रहीत है। कुछ पुराने चैट हटाए जा रहे हैं।";
const MAX_RECOVERY_REMOVALS = 8;
const PROTECTED_STORAGE_PREFIXES = ["sb-"];
const PROTECTED_STORAGE_KEYS = new Set([STORAGE_KEY, "theme"]);
const PRIORITY_PURGE_KEYS = [
  "studyai_saved_content",
  "youtube_search_cache",
  "youtube_history",
  "remote_config",
  "chat_history",
  "chat_sessions",
];
const PURGE_PATTERNS = [
  /^context_memory_/,
  /^teacher_chats_/,
  /^study_plans_/,
  /^active_study_plan_/,
  /^progress_/,
  /^weekly_quiz_/,
  /^personalization_/,
  /^studyai_/,
];

export function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        throw new Error("localStorage is not available");
      }
      
      // Initialize storage if needed
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
      }
      
      resolve();
    } catch (error) {
      console.error("Storage error:", error);
      toast.error("Failed to initialize storage");
      reject(new Error("Failed to initialize storage"));
    }
  });
}

export function getItem(key: string): any {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsedData = safeParseStore(data);
    return parsedData[key];
  } catch (error) {
    console.error("Error reading from storage:", error);
    toast.error("Failed to read data");
    return null;
  }
}

export function setItem(key: string, value: any): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || "{}";
    const parsedData = safeParseStore(data);
    parsedData[key] = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        throw error;
      }

      const chats = parsedData[CHATS_STORE];
      if (!chats || typeof chats !== "object") {
        throw error;
      }

      const oldestChatId = Object.entries(chats as Record<string, { timestamp?: number }>)
        .sort(([, first], [, second]) => (first?.timestamp ?? 0) - (second?.timestamp ?? 0))[0]?.[0];

      if (!oldestChatId) {
        throw error;
      }

      delete chats[oldestChatId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
      } catch (retryError) {
        if (isQuotaExceededError(retryError)) {
          recoverStorageQuota();
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
            toast.warning("स्टोरेज भर गया था, कुछ पुराना लोकल डेटा साफ किया गया है।");
            return;
          } catch (finalError) {
            toast.error(QUOTA_PRUNE_TOAST);
            console.error("Storage quota final retry failed:", finalError);
            return;
          }
        }
        toast.error(QUOTA_PRUNE_TOAST);
        console.error("Storage quota retry failed:", retryError);
      }
    }
  } catch (error) {
    console.error("Error writing to storage:", error);
    toast.error("Failed to save data");
  }
}

function recoverStorageQuota(): void {
  const removableKeys: string[] = [];
  const seen = new Set<string>();

  const maybeAdd = (key: string | null) => {
    if (!key || seen.has(key) || isProtectedStorageKey(key)) {
      return;
    }
    seen.add(key);
    removableKeys.push(key);
  };

  for (const key of PRIORITY_PURGE_KEYS) {
    maybeAdd(key);
  }

  for (const key of Object.keys(localStorage)) {
    if (PURGE_PATTERNS.some((pattern) => pattern.test(key))) {
      maybeAdd(key);
    }
  }

  const sizedCandidates = removableKeys
    .map((key) => ({
      key,
      size: localStorage.getItem(key)?.length ?? 0,
    }))
    .sort((first, second) => second.size - first.size)
    .slice(0, MAX_RECOVERY_REMOVALS);

  for (const candidate of sizedCandidates) {
    localStorage.removeItem(candidate.key);
  }
}

function isProtectedStorageKey(key: string): boolean {
  if (PROTECTED_STORAGE_KEYS.has(key)) {
    return true;
  }
  return PROTECTED_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false;
  }
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
}

export function removeItem(key: string): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    
    const parsedData = safeParseStore(data);
    delete parsedData[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
  } catch (error) {
    console.error("Error removing from storage:", error);
    toast.error("Failed to delete data");
  }
}

function safeParseStore(rawData: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawData);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch (error) {
    console.error("Corrupt chat storage detected, resetting store:", error);
  }

  const emptyStore: Record<string, unknown> = {};
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStore));
  return emptyStore;
}
