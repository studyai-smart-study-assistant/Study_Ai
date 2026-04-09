
import { toast } from "sonner";

export const CHATS_STORE = "chats";
const STORAGE_KEY = "gemini-chat-data";

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
    
    const parsedData = JSON.parse(data);
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
    const parsedData = JSON.parse(data);
    parsedData[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
  } catch (error) {
    console.error("Error writing to storage:", error);
    toast.error("Failed to save data");
  }
}

export function removeItem(key: string): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    
    const parsedData = JSON.parse(data);
    delete parsedData[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
  } catch (error) {
    console.error("Error removing from storage:", error);
    toast.error("Failed to delete data");
  }
}
