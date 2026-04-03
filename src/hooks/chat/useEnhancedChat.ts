
import { useState, useEffect, useCallback } from 'react';
import { chatDB } from '@/lib/db';
import { generateResponse, generateResponseWithSearch, WebSearchSource } from '@/lib/gemini';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Message as MessageType } from '@/lib/db';
import { chatHandler } from '@/utils/enhancedChatHandler';
import { saveImageToGallery } from '@/lib/imageGalleryDB';

const GUEST_MESSAGE_LIMIT = 50;

export const useEnhancedChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [lastSources, setLastSources] = useState<WebSearchSource[]>([]);
  const { currentUser, messageLimitReached, setMessageLimitReached } = useAuth();

  useEffect(() => {
    if (chatId) {
      loadMessages();
      setLastSources([]); // Reset sources on chat change
    }
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chat = await chatDB.getChat(chatId);
      if (chat) {
        setMessages(chat.messages || []);
        
        if (chat.title === "New Chat" && chat.messages && chat.messages.length > 0) {
          const firstUserMessage = chat.messages.find(m => m.role === 'user');
          if (firstUserMessage) {
            const newTitle = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            await chatDB.updateChatTitle(chatId, newTitle);
          }
        }
        
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

  const enhancedSendMessage = useCallback(async (input: string, imageUrl?: string, skipAIResponse: boolean = false, reasoningMode: boolean = false) => {
    if ((!input.trim() && !imageUrl) || isLoading || isResponding) return;
    
    if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setIsResponding(true);
      setConnectionStatus('connected');
      setLastSources([]); // Clear previous sources
      
      // For display: store text + file marker separately
      const isBase64Image = imageUrl?.startsWith('data:image/');
      const isBase64Pdf = imageUrl?.startsWith('data:application/pdf');
      let messageContent = input.trim();
      let imageBase64: string | undefined;
      
      if (isBase64Pdf && imageUrl) {
        const textPart = messageContent || 'इस PDF के बारे में बताओ';
        messageContent = `[PDF_ATTACHED] 📄 ${textPart}`;
        imageBase64 = imageUrl; // Send PDF base64 to AI for analysis
      } else if (isBase64Image && imageUrl) {
        const textPart = messageContent || 'इस image के बारे में बताओ';
        // Store full base64 in content so it renders in chat
        messageContent = `[IMG_DATA:${imageUrl}]${textPart}`;
        imageBase64 = imageUrl;
      } else if (imageUrl) {
        messageContent = messageContent ? `${messageContent}\n\n[Image: ${imageUrl}]` : `[Image: ${imageUrl}]`;
      }
      
      const userMessage = await chatDB.addMessage(chatId, messageContent, 'user');
      setMessages((prev) => [...prev, userMessage]);
      
      const chat = await chatDB.getChat(chatId);
      if (chat && chat.title === "New Chat") {
        const newTitle = input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : '');
        await chatDB.updateChatTitle(chatId, newTitle);
      }
      
      if (onChatUpdated) onChatUpdated();

      if (skipAIResponse) {
        // Show the generated image in the bot message
        const botContent = imageUrl 
          ? `[IMG_DATA:${imageUrl}]✨ Image बन गई! ऊपर देखें।`
          : '✨ Image generated!';
        await chatDB.addMessage(chatId, botContent, 'bot');
        await loadMessages();
      } else {
        const currentChat = await chatDB.getChat(chatId);
        const chatHistory = currentChat?.messages || [];
        
        const userId = currentUser?.uid || 'guest';
        
        // Clean the prompt for AI - remove IMG_DATA/PDF markers
        const aiPrompt = messageContent
          .replace(/^\[IMG_DATA:[^\]]+\]/, '')
          .replace(/^\[PDF_ATTACHED\]\s*📄\s*/, '')
          .trim() || (isBase64Pdf ? 'इस PDF document को analyze करो' : 'इस image के बारे में बताओ');
        
        const result = await chatHandler.processQuery(
          aiPrompt,
          async (query: string) => {
            setConnectionStatus('reconnecting');
            
            const searchResult = await generateResponseWithSearch(query, chatHistory, chatId, 'google/gemini-3-flash-preview', webSearchEnabled, imageBase64, reasoningMode);
            setLastSources(searchResult.sources);
            
            // If agent generated an image, save to gallery
            if (searchResult.imageUrl) {
              try {
                await saveImageToGallery({
                  id: crypto.randomUUID(),
                  prompt: query,
                  imageData: searchResult.imageUrl,
                  createdAt: Date.now(),
                });
              } catch (e) { console.warn('Gallery save failed:', e); }
            }
            
            setConnectionStatus('connected');
            return searchResult.text;
          },
          chatHistory.map(msg => ({
            sender: msg.role === 'user' ? 'user' : 'ai' as const,
            text: msg.content,
            timestamp: msg.timestamp
          })),
          userId
        );
        
        if (result.source === 'custom') {
          await chatDB.addMessage(chatId, result.response, 'bot');
        }
        
        await loadMessages();
      }
      
      if (onChatUpdated) onChatUpdated();
      
      if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT - 1) {
        setMessageLimitReached(true);
        setShowLimitAlert(true);
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      setConnectionStatus('disconnected');
      
      let errorMessage = 'Failed to send message';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection lost. Please check your internet connection.';
        setConnectionStatus('disconnected');
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'service is busy. Please wait a moment and try again.';
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
  }, [chatId, currentUser, messages, isLoading, isResponding, onChatUpdated, webSearchEnabled]);

  const sendMessage = enhancedSendMessage;

  const getChatStats = useCallback(() => {
    return chatHandler.getStats();
  }, []);

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
    getChatStats,
    webSearchEnabled,
    setWebSearchEnabled,
    lastSources
  };
};
