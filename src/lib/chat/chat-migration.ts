import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { idbDelete, idbGet, idbGetAll, STORES } from '@/lib/storage/indexedDb';
import type { Chat, Message } from './types';

const APP_DATA_KEY = 'app_data_v1';
const LEGACY_CHAT_KEY = 'chats';
const STORAGE_METADATA_KEY = 'studyai_storage_backend';
const MIGRATION_DONE_PREFIX = 'studyai_chat_cloud_migrated_';
const MESSAGE_BATCH_SIZE = 200;

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeUuidFromHash = (hex: string): string => {
  const chars = hex.slice(0, 32).split('');
  if (chars.length < 32) {
    return crypto.randomUUID();
  }

  chars[12] = '4';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);

  return `${chars.slice(0, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}-${chars
    .slice(16, 20)
    .join('')}-${chars.slice(20, 32).join('')}`;
};

const computeMessageId = async (chatId: string, message: Message): Promise<string> => {
  if (message.id && isUuid(message.id)) {
    return message.id;
  }

  const payload = `${chatId}|${message.role}|${message.timestamp}|${message.content}`;
  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const hashHex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return normalizeUuidFromHash(hashHex);
};

const toIsoString = (timestamp: number): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

type LegacyChatsMap = Record<string, Chat>;

async function readLegacyChatsFromAppData(): Promise<Chat[]> {
  const appData = (await idbGet<Record<string, unknown>>(STORES.appData, APP_DATA_KEY)) ?? {};
  const chatMap = (appData[LEGACY_CHAT_KEY] as LegacyChatsMap | undefined) ?? {};
  return Object.values(chatMap || {});
}

async function readLegacyChatsFromOldStore(): Promise<Chat[]> {
  return idbGetAll<Chat>(STORES.chats);
}

function dedupeChats(chats: Chat[]): Chat[] {
  const map = new Map<string, Chat>();

  for (const chat of chats) {
    if (!chat?.id) continue;
    const existing = map.get(chat.id);
    if (!existing || (chat.timestamp ?? 0) > (existing.timestamp ?? 0)) {
      map.set(chat.id, {
        ...chat,
        messages: Array.isArray(chat.messages) ? chat.messages : [],
      });
    }
  }

  return Array.from(map.values());
}

export async function isChatMigrationNeeded(userId: string): Promise<boolean> {
  if (!userId) return false;

  const migrationMarker = localStorage.getItem(`${MIGRATION_DONE_PREFIX}${userId}`);
  const [legacyAppDataChats, legacyStoreChats] = await Promise.all([
    readLegacyChatsFromAppData(),
    readLegacyChatsFromOldStore(),
  ]);

  const hasLegacyStorageKey = Boolean(localStorage.getItem(STORAGE_METADATA_KEY));
  const hasLegacyChats = legacyAppDataChats.length > 0 || legacyStoreChats.length > 0;

  if (!hasLegacyChats) return false;
  if (!migrationMarker) return true;

  return hasLegacyStorageKey;
}

async function clearLegacyChatData(): Promise<void> {
  const [legacyStoreChats] = await Promise.all([readLegacyChatsFromOldStore()]);

  await idbDelete(STORES.appData, APP_DATA_KEY);

  await Promise.all(
    legacyStoreChats
      .filter((chat) => chat?.id)
      .map((chat) => idbDelete(STORES.chats, chat.id))
  );

  localStorage.removeItem(STORAGE_METADATA_KEY);
}

export async function migrateLegacyChatsToCloud(userId: string): Promise<boolean> {
  if (!userId) return false;

  const shouldMigrate = await isChatMigrationNeeded(userId);
  if (!shouldMigrate) return false;

  const [legacyAppDataChats, legacyStoreChats] = await Promise.all([
    readLegacyChatsFromAppData(),
    readLegacyChatsFromOldStore(),
  ]);

  const chats = dedupeChats([...legacyAppDataChats, ...legacyStoreChats]);
  if (!chats.length) return false;

  const candidateConversationIds = chats.map((chat) => chat.id);
  const { data: existingUserConversations, error: existingConversationsError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .in('id', candidateConversationIds);

  if (existingConversationsError) {
    throw new Error(
      `Failed to check existing conversations for migration (user ${userId}): ${existingConversationsError.message}`
    );
  }

  const existingConversationIds = new Set((existingUserConversations ?? []).map((conversation) => conversation.id));

  const conversationRows = chats.map((chat) => ({
    id: chat.id,
    user_id: userId,
    created_at: toIsoString(chat.timestamp || Date.now()),
  }));

  const { error: conversationError } = await supabase
    .from('conversations')
    .upsert(conversationRows, { onConflict: 'id' });

  if (conversationError) {
    throw new Error(
      `Conversation migration write failed (possible RLS block) for user ${userId}: ${conversationError.message}`
    );
  }

  const { data: migratedConversations, error: migratedConversationIdsError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .in('id', candidateConversationIds);

  if (migratedConversationIdsError) {
    throw new Error(
      `Failed to verify migrated conversations for user ${userId}: ${migratedConversationIdsError.message}`
    );
  }

  const migratedConversationIds = new Set([
    ...existingConversationIds,
    ...(migratedConversations ?? []).map((conversation) => conversation.id),
  ]);

  const messageRows = await Promise.all(
    chats
      .filter((chat) => migratedConversationIds.has(chat.id))
      .flatMap((chat) =>
        (chat.messages || []).map(async (message) => {
          const messageId = await computeMessageId(chat.id, message);
          return {
            id: messageId,
            chat_id: chat.id,
            sender_id: message.role,
            message_type: message.role,
            text_content: message.content,
            created_at: toIsoString(message.timestamp || chat.timestamp || Date.now()),
            edited_at: message.editedAt ? toIsoString(message.editedAt) : null,
          };
        })
      )
  );

  for (let index = 0; index < messageRows.length; index += MESSAGE_BATCH_SIZE) {
    const batch = messageRows.slice(index, index + MESSAGE_BATCH_SIZE);
    if (!batch.length) continue;

    const { error: messageError } = await supabase
      .from('chat_messages')
      .upsert(batch, { onConflict: 'id' });

    if (messageError) {
      throw new Error(
        `Message migration write failed (possible RLS block) for user ${userId} in batch starting at ${index}: ${messageError.message}`
      );
    }
  }

  await clearLegacyChatData();
  localStorage.setItem(`${MIGRATION_DONE_PREFIX}${userId}`, 'true');
  toast.success('Your chats are now synced to cloud');

  return true;
}
