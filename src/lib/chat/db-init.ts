
import { toast } from "sonner";

export const CHATS_STORE = "chats";
const STORAGE_KEY = "gemini-chat-data";
const QUOTA_PRUNE_TOAST = "बहुत अधिक चैट डेटा संग्रहीत है। कुछ पुराने चैट हटाए जा रहे हैं।";

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
        toast.error(QUOTA_PRUNE_TOAST);
        console.error("Storage quota retry failed:", retryError);
      }
    }
  } catch (error) {
    console.error("Error writing to storage:", error);
    toast.error("Failed to save data");
  }
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
