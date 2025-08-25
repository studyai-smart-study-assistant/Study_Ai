
import { useState, useEffect } from 'react';
import { chatDB } from '@/lib/db';
import { Message as MessageType } from '@/lib/db';
import { toast } from "sonner";
import { getGroupDetails } from '@/lib/firebase';

export const useChatData = (chatId: string) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const chat = await chatDB.getChat(chatId);
        if (chat) {
          setMessages(chat.messages || []);
          setDisplayName(chat.title || 'Chat');
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
        setLoadError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  const refreshMessages = async () => {
    try {
      const chat = await chatDB.getChat(chatId);
      if (chat) {
        setMessages(chat.messages || []);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  return {
    messages,
    isLoading,
    displayName,
    groupDetails,
    loadError,
    setMessages,
    refreshMessages
  };
};
