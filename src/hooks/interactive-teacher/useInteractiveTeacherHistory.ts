import { useState, useEffect } from 'react';
import { chatDB, type Chat, type Message } from '@/lib/db';

export interface InteractiveTeacherChatMetadata {
  subject: string;
  chapter: string;
  studentName: string;
  context: unknown;
  messageCount: number;
}

export type InteractiveTeacherChatMessage = Omit<Message, 'chatId' | 'role'> &
  Partial<Pick<Message, 'chatId' | 'role' | 'bookmarked' | 'liked' | 'editedAt'>> & {
    isQuestion?: boolean;
    awaitingResponse?: boolean;
  };

type InteractiveTeacherStoredChat = Chat & {
  type?: string;
  metadata?: Partial<InteractiveTeacherChatMetadata>;
  messages: InteractiveTeacherChatMessage[];
};

export interface InteractiveTeacherChat {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  studentName: string;
  timestamp: number;
  messages: InteractiveTeacherChatMessage[];
  context: InteractiveTeacherChatMetadata['context'] | null;
}

interface SaveInteractiveTeacherChatInput {
  title: string;
  subject: string;
  chapter: string;
  studentName: string;
  messages: InteractiveTeacherChatMessage[];
  context: InteractiveTeacherChatMetadata['context'];
}

export const useInteractiveTeacherHistory = () => {
  const [chats, setChats] = useState<InteractiveTeacherChat[]>([]);

  const loadHistory = async () => {
    try {
      const allChats = await chatDB.getAllChats();
      const interactiveChats = allChats
        .filter((chat) => {
          const typedChat = chat as InteractiveTeacherStoredChat;
          return typedChat.type === 'interactive-teacher';
        })
        .map((chat) => {
          const typedChat = chat as InteractiveTeacherStoredChat;
          const metadata = typedChat.metadata;

          return {
            id: typedChat.id,
            title: typedChat.title,
            subject: metadata?.subject || '',
            chapter: metadata?.chapter || '',
            studentName: metadata?.studentName || '',
            timestamp: typedChat.timestamp,
            messages: typedChat.messages,
            context: metadata?.context || null
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
      setChats(interactiveChats);
      console.log('Loaded', interactiveChats.length, 'interactive teacher chats');
    } catch (error) {
      console.error('Error loading interactive teacher history:', error);
    }
  };

  const saveChat = async (chat: SaveInteractiveTeacherChatInput) => {
    try {
      console.log('Saving chat with', chat.messages.length, 'messages');

      const newChat = await chatDB.createNewChat();
      const updatedChat: InteractiveTeacherStoredChat = {
        ...newChat,
        type: 'interactive-teacher',
        title: chat.title,
        timestamp: Date.now(),
        messages: chat.messages, // Ensure all messages are saved
        metadata: {
          subject: chat.subject,
          chapter: chat.chapter,
          studentName: chat.studentName,
          context: chat.context,
          messageCount: chat.messages.length // Track message count for debugging
        }
      };

      // Save the complete chat data
      await chatDB.saveChat(updatedChat);
      console.log('Successfully saved chat with', chat.messages.length, 'messages');

      // Reload history to show updated data
      await loadHistory();
      return newChat.id;
    } catch (error) {
      console.error('Error saving interactive teacher chat:', error);
      throw error;
    }
  };

  const updateChat = async (chatId: string, messages: InteractiveTeacherChatMessage[]) => {
    try {
      console.log('Updating chat', chatId, 'with', messages.length, 'messages');

      const existingChat = await chatDB.getChat(chatId);
      if (existingChat) {
        const chatWithMetadata = existingChat as InteractiveTeacherStoredChat;

        const updatedChat: InteractiveTeacherStoredChat = {
          ...existingChat,
          messages, // Update with new messages
          timestamp: Date.now(), // Update timestamp
          metadata: {
            ...chatWithMetadata.metadata,
            messageCount: messages.length
          }
        };

        await chatDB.saveChat(updatedChat);
        await loadHistory();
        console.log('Successfully updated chat with', messages.length, 'messages');
      }
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await chatDB.deleteChat(chatId);
      await loadHistory();
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return {
    chats,
    loadHistory,
    saveChat,
    updateChat,
    deleteChat
  };
};
