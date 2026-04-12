import { Chat, Message } from './types';
import { initDB } from './db-init';
import {
  getAllChats as getAllChatsOperation,
  getChat as getChatOperation,
  saveChat as saveChatOperation,
  deleteChat as deleteChatOperation,
} from './chat-operations';
import { addMessage, editMessage, deleteMessage, toggleMessageBookmark } from './message-operations';
import { loadCloudChats, saveCloudChats } from './cloud-sync';

export class ChatDB {
  private dbReady: Promise<void> | null = null;
  private cloudHydrated = false;
  private cloudSyncTimer: number | null = null;

  private async ensureReady(): Promise<void> {
    if (!this.dbReady) {
      this.dbReady = initDB();
    }
    await this.dbReady;

    if (!this.cloudHydrated) {
      await this.hydrateFromCloudOnce();
      this.cloudHydrated = true;
    }
  }

  private async hydrateFromCloudOnce(): Promise<void> {
    const cloudChats = await loadCloudChats();

    // No authenticated user, nothing to hydrate.
    if (cloudChats === null) return;

    if (cloudChats.length > 0) {
      await Promise.all(cloudChats.map((chat) => saveChatOperation(chat)));
      return;
    }

    // Migration path: if cloud is empty but local has existing chats, upload once.
    const localChats = await getAllChatsOperation();
    if (localChats.length > 0) {
      await saveCloudChats(localChats);
    }
  }

  private scheduleCloudSync(): void {
    if (this.cloudSyncTimer) {
      window.clearTimeout(this.cloudSyncTimer);
    }

    this.cloudSyncTimer = window.setTimeout(async () => {
      try {
        const chats = await getAllChatsOperation();
        await saveCloudChats(chats);
      } catch (error) {
        console.error('[chat-db] Cloud sync failed:', error);
      }
    }, 1200);
  }

  async getAllChats(): Promise<Chat[]> {
    await this.ensureReady();
    return getAllChatsOperation();
  }

  async getChat(id: string): Promise<Chat | null> {
    await this.ensureReady();
    return getChatOperation(id);
  }

  async saveChat(chat: Chat): Promise<void> {
    await this.ensureReady();
    await saveChatOperation(chat);
    this.scheduleCloudSync();
  }

  async updateChatTitle(id: string, title: string): Promise<void> {
    const chat = await this.getChat(id);
    if (!chat) throw new Error('Chat not found');

    chat.title = title;
    await this.saveChat(chat);
  }

  async deleteChat(id: string): Promise<void> {
    await this.ensureReady();
    await deleteChatOperation(id);
    this.scheduleCloudSync();
  }

  async createNewChat(): Promise<Chat> {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const chat: Chat = {
      id,
      title: 'New Chat',
      timestamp,
      messages: [],
    };

    await this.saveChat(chat);
    return chat;
  }

  async addMessage(chatId: string, content: string, role: 'user' | 'bot'): Promise<Message> {
    await this.ensureReady();
    const message = await addMessage(chatId, content, role);
    this.scheduleCloudSync();
    return message;
  }

  async editMessage(chatId: string, messageId: string, content: string): Promise<void> {
    await this.ensureReady();
    await editMessage(chatId, messageId, content);
    this.scheduleCloudSync();
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await this.ensureReady();
    await deleteMessage(chatId, messageId);
    this.scheduleCloudSync();
  }

  async toggleMessageBookmark(chatId: string, messageId: string): Promise<boolean> {
    await this.ensureReady();
    const status = await toggleMessageBookmark(chatId, messageId);
    this.scheduleCloudSync();
    return status;
  }
}

export const chatDB = new ChatDB();
