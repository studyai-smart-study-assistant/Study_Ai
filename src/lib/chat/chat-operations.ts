
import { Chat } from "./types";
import { CHATS_STORE, getItem, setItem, removeItem } from "./db-init";

export async function getAllChats(): Promise<Chat[]> {
  try {
    const chatData = getItem(CHATS_STORE) || {};
    const chats = Object.values(chatData) as Chat[];
    return chats.sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
  } catch (error) {
    console.error("Error getting chats:", error);
    throw new Error("Failed to get chats");
  }
}

export async function getChat(id: string): Promise<Chat | null> {
  try {
    const chatData = getItem(CHATS_STORE) || {};
    return chatData[id] || null;
  } catch (error) {
    console.error("Error getting chat:", error);
    throw new Error("Failed to get chat");
  }
}

export async function saveChat(chat: Chat): Promise<void> {
  try {
    const chatData = getItem(CHATS_STORE) || {};
    chatData[chat.id] = chat;
    setItem(CHATS_STORE, chatData);
  } catch (error) {
    console.error("Error saving chat:", error);
    throw new Error("Failed to save chat");
  }
}

export async function deleteChat(id: string): Promise<void> {
  try {
    const chatData = getItem(CHATS_STORE) || {};
    delete chatData[id];
    setItem(CHATS_STORE, chatData);
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw new Error("Failed to delete chat");
  }
}
