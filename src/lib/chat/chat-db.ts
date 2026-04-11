import { Chat, Message } from './types';
import { initDB } from './db-init';
import {
  getAllChats as getAllChatsOperation,
  getChat as getChatOperation,
  saveChat as saveChatOperation,
  deleteChat as deleteChatOperation,
} from './chat-operations';
import { addMessage, editMessage, deleteMessage, toggleMessageBookmark } from './message-operations';

export class ChatDB {
  private dbReady: Promise<void> | null = null;

  private async ensureReady(): Promise<void> {
    if (!this.dbReady) {
      this.dbReady = initDB();
    }
    await this.dbReady;
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
    return saveChatOperation(chat);
  }

  async updateChatTitle(id: string, title: string): Promise<void> {
    const chat = await this.getChat(id);
    if (!chat) throw new Error('Chat not found');

    chat.title = title;
    await this.saveChat(chat);
  }

  async deleteChat(id: string): Promise<void> {
    await this.ensureReady();
    return deleteChatOperation(id);
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
    return addMessage(chatId, content, role);
  }

  async editMessage(chatId: string, messageId: string, content: string): Promise<void> {
    await this.ensureReady();
    return editMessage(chatId, messageId, content);
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await this.ensureReady();
    return deleteMessage(chatId, messageId);
  }

  async toggleMessageBookmark(chatId: string, messageId: string): Promise<boolean> {
    await this.ensureReady();
    return toggleMessageBookmark(chatId, messageId);
  }
}

export const chatDB = new ChatDB();
