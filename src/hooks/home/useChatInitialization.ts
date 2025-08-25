
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { chatDB } from '@/lib/db';

export const useChatInitialization = () => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const chats = await chatDB.getAllChats();
      
      if (chats.length > 0) {
        setCurrentChatId(chats[0].id);
      } else {
        const newChat = await chatDB.createNewChat();
        setCurrentChatId(newChat.id);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigationState = async () => {
    if (location.state?.activeChatId) {
      const chatId = location.state.activeChatId;
      try {
        const chat = await chatDB.getChat(chatId);
        if (chat) {
          setCurrentChatId(chatId);
          if (location.state.source === 'teacher-chats') {
            toast.success('Teacher chat loaded successfully');
          }
        } else {
          console.error('Chat not found:', chatId);
          initializeChat();
        }
      } catch (error) {
        console.error('Error loading chat from navigation:', error);
        initializeChat();
      }
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await chatDB.createNewChat();
      setCurrentChatId(newChat.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Failed to create new chat');
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return {
    currentChatId,
    isLoading,
    initializeChat,
    handleNavigationState,
    handleNewChat,
    handleChatSelect
  };
};
