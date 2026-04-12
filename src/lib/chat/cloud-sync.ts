import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Chat } from './types';

const supabaseAny = supabase as unknown as SupabaseClient<any>;

type UserPrivateDataRow = {
  user_id: string;
  chat_history: Chat[] | null;
  app_data: Record<string, string> | null;
};

async function getAuthenticatedUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function loadCloudChats(): Promise<Chat[] | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const { data, error } = await supabaseAny
    .from('user_private_data')
    .select('user_id, chat_history, app_data')
    .eq('user_id', userId)
    .maybeSingle<UserPrivateDataRow>();

  if (error) {
    console.error('[cloud-sync] Failed to load cloud chats:', error);
    return null;
  }

  const chatHistory = data?.chat_history;
  if (!Array.isArray(chatHistory)) return [];

  return chatHistory as Chat[];
}

export async function saveCloudChats(chats: Chat[]): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const payload = {
    user_id: userId,
    chat_history: chats,
  };

  const { error } = await supabaseAny
    .from('user_private_data')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.error('[cloud-sync] Failed to save cloud chats:', error);
    return false;
  }

  return true;
}

export async function loadCloudAppData(): Promise<Record<string, string> | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const { data, error } = await supabaseAny
    .from('user_private_data')
    .select('user_id, app_data')
    .eq('user_id', userId)
    .maybeSingle<UserPrivateDataRow>();

  if (error) {
    console.error('[cloud-sync] Failed to load cloud app data:', error);
    return null;
  }

  const appData = data?.app_data;
  if (!appData || typeof appData !== 'object' || Array.isArray(appData)) return {};

  return appData;
}

export async function saveCloudAppData(appData: Record<string, string>): Promise<boolean> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const payload = {
    user_id: userId,
    app_data: appData,
  };

  const { error } = await supabaseAny
    .from('user_private_data')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.error('[cloud-sync] Failed to save cloud app data:', error);
    return false;
  }

  return true;
}
