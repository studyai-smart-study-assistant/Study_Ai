
import { useState, useEffect, useCallback } from 'react';
import { chatDB } from '@/lib/db';
import { generateResponse } from '@/lib/gemini';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { Message as MessageType } from '@/lib/db';
import { chatHandler } from '@/utils/enhancedChatHandler';

const GUEST_MESSAGE_LIMIT = 2;

export const useEnhancedChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
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

  const enhancedSendMessage = useCallback(async (input: string, imageUrl?: string, skipAIResponse: boolean = false) => {
    if ((!input.trim() && !imageUrl) || isLoading || isResponding) return;
    
    // Check if user has reached message limit
    if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setIsResponding(true);
      setConnectionStatus('connected');
      
      // Prepare message content
      let messageContent = input.trim();
      if (imageUrl) {
        messageContent = imageUrl ? `${messageContent}\n\n[Image: ${imageUrl}]` : `[Image: ${imageUrl}]`;
      }
      
      // Add user message to local storage
      const userMessage = await chatDB.addMessage(chatId, messageContent, 'user');
      
      // Update local state
      setMessages((prev) => [...prev, userMessage]);
      
      // Update chat title if it's the first message
      const chat = await chatDB.getChat(chatId);
      if (chat && chat.title === "New Chat") {
        const newTitle = input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : '');
        await chatDB.updateChatTitle(chatId, newTitle);
      }
      
      if (onChatUpdated) onChatUpdated();

      // Skip AI response if this is just an image message
      if (skipAIResponse) {
        // Just add a simple bot acknowledgment for image
        await chatDB.addMessage(chatId, '✨ Image सफलतापूर्वक generate हो गई है!', 'bot');
        await loadMessages();
      } else {
        // Get current conversation history
        const currentChat = await chatDB.getChat(chatId);
        const chatHistory = currentChat?.messages || [];
        
        // Use enhanced chat handler for better response management
        const userId = currentUser?.uid || 'guest';
        
        const result = await chatHandler.processQuery(
          messageContent,
          async (query: string) => {
            setConnectionStatus('reconnecting');
            const response = await generateResponse(query, chatHistory, chatId);
            setConnectionStatus('connected');
            return response;
          },
          chatHistory.map(msg => ({
            sender: msg.role === 'user' ? 'user' : 'ai' as const,
            text: msg.content,
            timestamp: msg.timestamp
          })),
          userId
        );
        
        // If this was a custom response, we need to store it manually
        if (result.source === 'custom') {
          await chatDB.addMessage(chatId, result.response, 'bot');
        }
        
        // Refresh messages from storage to ensure we have the latest data
        await loadMessages();
      }
      
      if (onChatUpdated) onChatUpdated();
      
      // Check if this message hits the limit
      if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT - 1) {
        setMessageLimitReached(true);
        setShowLimitAlert(true);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('disconnected');
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to send message';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection lost. Please check your internet connection.';
        setConnectionStatus('disconnected');
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'AI service is busy. Please wait a moment and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => enhancedSendMessage(input)
        }
      });
      
    } finally {
      setIsLoading(false);
      setIsResponding(false);
    }
  }, [chatId, currentUser, messages, isLoading, isResponding, onChatUpdated]);

  const sendMessage = enhancedSendMessage;

  const getChatStats = useCallback(() => {
    return chatHandler.getStats();
  }, []);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    messages,
    isLoading,
    isResponding,
    showLimitAlert,
    setShowLimitAlert,
    loadMessages,
    sendMessage,
    enhancedSendMessage,
    messageLimitReached,
    connectionStatus,
    getChatStats
  };
};
