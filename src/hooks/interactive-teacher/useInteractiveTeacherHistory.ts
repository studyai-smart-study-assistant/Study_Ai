
import { useState, useEffect } from 'react';
import { chatDB } from '@/lib/db';

export interface InteractiveTeacherChat {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  studentName: string;
  timestamp: number;
  messages: any[];
  context: any;
}

export const useInteractiveTeacherHistory = () => {
  const [chats, setChats] = useState<InteractiveTeacherChat[]>([]);
  
  const loadHistory = async () => {
    try {
      const allChats = await chatDB.getAllChats();
      const interactiveChats = allChats
        .filter(chat => (chat as any).type === 'interactive-teacher')
        .map(chat => ({
          id: chat.id,
          title: chat.title,
          subject: (chat as any).metadata?.subject || '',
          chapter: (chat as any).metadata?.chapter || '',
          studentName: (chat as any).metadata?.studentName || '',
          timestamp: chat.timestamp,
          messages: chat.messages,
          context: (chat as any).metadata?.context || null
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
      setChats(interactiveChats);
      console.log('Loaded', interactiveChats.length, 'interactive teacher chats');
    } catch (error) {
      console.error('Error loading interactive teacher history:', error);
    }
  };

  const saveChat = async (chat: {
    title: string;
    subject: string;
    chapter: string;
    studentName: string;
    messages: any[];
    context: any;
  }) => {
    try {
      console.log('Saving chat with', chat.messages.length, 'messages');
      
      const newChat = await chatDB.createNewChat();
      const updatedChat = {
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

  const updateChat = async (chatId: string, messages: any[]) => {
    try {
      console.log('Updating chat', chatId, 'with', messages.length, 'messages');
      
      const existingChat = await chatDB.getChat(chatId);
      if (existingChat) {
        // Cast to any to access metadata safely
        const chatWithMetadata = existingChat as any;
        
        const updatedChat = {
          ...existingChat,
          messages: messages, // Update with new messages
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
