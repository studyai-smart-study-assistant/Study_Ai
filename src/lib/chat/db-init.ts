import { toast } from 'sonner';
import { idbDelete, idbGet, idbSet, STORES } from '@/lib/storage/indexedDb';

export const CHATS_STORE = 'chats';
const APP_DATA_KEY = 'app_data_v1';

export type AppDataStore = Record<string, unknown>;

export async function initDB(): Promise<void> {
  try {
    await idbGet<AppDataStore>(STORES.appData, APP_DATA_KEY);
  } catch (error) {
    console.error('Storage error:', error);
    toast.error('Failed to initialize storage');
    throw new Error('Failed to initialize storage');
  }
}

export async function getItem<T = unknown>(key: string): Promise<T | null> {
  try {
    const data = (await idbGet<AppDataStore>(STORES.appData, APP_DATA_KEY)) ?? {};
    return (data[key] as T | undefined) ?? null;
  } catch (error) {
    console.error('Error reading from storage:', error);
    toast.error('Failed to read data');
    return null;
  }
}

export async function setItem(key: string, value: unknown): Promise<void> {
  try {
    const data = (await idbGet<AppDataStore>(STORES.appData, APP_DATA_KEY)) ?? {};
    data[key] = value;
    await idbSet(STORES.appData, APP_DATA_KEY, data);
  } catch (error) {
    console.error('Error writing to storage:', error);
    toast.error('Failed to save data');
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    const data = (await idbGet<AppDataStore>(STORES.appData, APP_DATA_KEY)) ?? {};
    delete data[key];
    await idbSet(STORES.appData, APP_DATA_KEY, data);
  } catch (error) {
    console.error('Error removing from storage:', error);
    toast.error('Failed to delete data');
  }
}

export async function clearChatStorage(): Promise<void> {
  await idbDelete(STORES.appData, APP_DATA_KEY);
}
