
import { useState, useEffect, useRef } from 'react';
import { chatDB, Message as MessageType } from '@/lib/db';
import { generateResponse } from '@/lib/gemini';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { getGroupDetails, listenForMessages } from '@/lib/firebase';

// Adding constant for guest message limit
const GUEST_MESSAGE_LIMIT = 2;

// Export the useChatData hook
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

// Export the useChat hook
export const useChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const { currentUser, messageLimitReached, setMessageLimitReached } = useAuth();

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chat = await chatDB.getChat(chatId);
      if (chat) {
        setMessages(chat.messages || []);
        
        // Update chat title if it's still the default
        if (chat.title === "New Chat" && chat.messages && chat.messages.length > 0) {
          // Find the first user message to use as title
          const firstUserMessage = chat.messages.find(m => m.role === 'user');
          if (firstUserMessage) {
            const newTitle = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            await chatDB.updateChatTitle(chatId, newTitle);
          }
        }
        
        // Check message limit for non-logged in users
        if (!currentUser && chat.messages && chat.messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
          setMessageLimitReached(true);
          setShowLimitAlert(true);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading || isResponding) return;
    
    // Check if user has reached message limit
    if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setIsResponding(true);
      
      // Add user message to local storage
      const userMessage = await chatDB.addMessage(chatId, input.trim(), 'user');
      
      // Update local state
      setMessages((prev) => [...prev, userMessage]);
      
      // Update chat title if it's the first message
      const chat = await chatDB.getChat(chatId);
      if (chat && chat.title === "New Chat") {
        const newTitle = input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : '');
        await chatDB.updateChatTitle(chatId, newTitle);
      }
      
      if (onChatUpdated) onChatUpdated();

      // Get current conversation history
      const currentChat = await chatDB.getChat(chatId);
      const chatHistory = currentChat?.messages || [];
      
      // Get AI response (pass chatId to store response automatically)
      const response = await generateResponse(input.trim(), chatHistory, chatId);
      
      // Update local state with bot response (it's already stored in DB from generateResponse)
      // Refresh messages from storage to ensure we have the latest data
      await loadMessages();
      
      if (onChatUpdated) onChatUpdated();
      
      // Check if this message hits the limit
      if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT - 1) {
        setMessageLimitReached(true);
        setShowLimitAlert(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsResponding(false);
    }
  };

  return {
    messages,
    isLoading,
    isResponding,
    showLimitAlert,
    setShowLimitAlert,
    loadMessages,
    sendMessage,
    messageLimitReached
  };
};

// Add a specific hook for group chat that handles realtime updates
export const useGroupChat = (groupId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const messagesRef = useRef<any[]>([]);
  const unsubscribeRef = useRef<any>(null);
  
  // Load group details separately from the message subscription
  useEffect(() => {
    const loadGroupDetails = async () => {
      if (!groupId) return;
      
      try {
        const details = await getGroupDetails(groupId);
        setGroupDetails(details);
      } catch (error) {
        console.error('Error loading group details:', error);
      }
    };
    
    loadGroupDetails();
  }, [groupId]);
  
  // Set up the message listener with a stable reference
  useEffect(() => {
    if (!groupId) return;
    
    setIsLoading(true);
    
    // Use a stable callback to prevent re-renders
    const messageUpdateCallback = (newMessages: any[]) => {
      // Only update if messages have actually changed
      if (JSON.stringify(newMessages) !== JSON.stringify(messagesRef.current)) {
        messagesRef.current = newMessages;
        setMessages(newMessages);
        setIsLoading(false);
        if (onChatUpdated) onChatUpdated();
      } else {
        setIsLoading(false);
      }
    };
    
    // Subscribe to real-time updates
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    unsubscribeRef.current = listenForMessages(groupId, true, messageUpdateCallback);
    
    return () => {
      // Clean up listener when component unmounts
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [groupId, onChatUpdated]);
  
  return {
    messages,
    isLoading,
    groupDetails
  };
};
