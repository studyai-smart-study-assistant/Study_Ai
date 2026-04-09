
import { useState, useEffect, useRef } from 'react';
import { chatDB } from '@/lib/db';
import { generateResponse } from '@/lib/gemini';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Message as MessageType } from '@/lib/db';

// Adding constant for guest message limit
const GUEST_MESSAGE_LIMIT = 50;
const AI_RESPONSE_TIMEOUT_MS = 50000;
const FALLBACK_BOT_MESSAGE = "मुझे अभी जवाब देने में कठिनाई हो रही है। कृपया कुछ समय बाद पुनः प्रयास करें।";

export const useChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const sendingRef = useRef(false);
  const { currentUser, messageLimitReached, setMessageLimitReached } = useAuth();

  useEffect(() => {
    setActiveChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    if (activeChatId) {
      loadMessages();
    }
  }, [activeChatId]);

  useEffect(() => {
    setIsLoading(false);
    setIsResponding(false);

    const handlePageShow = () => {
      setIsLoading(false);
      setIsResponding(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chat = await chatDB.getChat(activeChatId);
      if (chat) {
        setMessages(chat.messages || []);
        
        // Update chat title if it's still the default
        if (chat.title === "New Chat" && chat.messages && chat.messages.length > 0) {
          // Find the first user message to use as title
          const firstUserMessage = chat.messages.find(m => m.role === 'user');
          if (firstUserMessage) {
            const newTitle = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
            await chatDB.updateChatTitle(activeChatId, newTitle);
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
    if (!input.trim() || isLoading || isResponding || sendingRef.current) return;
    
    // Check if user has reached message limit
    if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    let fallbackChatId = activeChatId;
    try {
      sendingRef.current = true;
      setIsLoading(true);
      setIsResponding(true);
      let nextChatId = activeChatId;
      let currentChat = await chatDB.getChat(nextChatId);
      if (!currentChat) {
        const newChat = await chatDB.createNewChat();
        nextChatId = newChat.id;
        fallbackChatId = newChat.id;
        setActiveChatId(newChat.id);
        currentChat = newChat;
      }
      fallbackChatId = nextChatId;
      
      // Add user message to local storage
      const userMessage = await chatDB.addMessage(nextChatId, input.trim(), 'user');
      
      // Update local state
      setMessages((prev) => [...prev, userMessage]);
      
      // Update chat title if it's the first message
      const chat = await chatDB.getChat(nextChatId);
      if (chat && chat.title === "New Chat") {
        const newTitle = input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : '');
        await chatDB.updateChatTitle(nextChatId, newTitle);
      }
      
      if (onChatUpdated) onChatUpdated();

      // Get current conversation history
      currentChat = await chatDB.getChat(nextChatId);
      const chatHistory = currentChat?.messages || [];
      
      // Get AI response (pass chatId to store response automatically)
      await Promise.race([
        generateResponse(input.trim(), chatHistory, nextChatId, undefined, {
          preferGuestAuth: !currentUser,
        }),
        new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error("AI response timed out in useChat.")), AI_RESPONSE_TIMEOUT_MS);
        }),
      ]);
      
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
      const refreshedChat = await chatDB.getChat(fallbackChatId);
      const lastMessage = refreshedChat?.messages?.[refreshedChat.messages.length - 1];
      if (fallbackChatId && lastMessage?.content !== FALLBACK_BOT_MESSAGE) {
        await chatDB.addMessage(fallbackChatId, FALLBACK_BOT_MESSAGE, 'bot');
      }
      await loadMessages();
      toast.error('Failed to send message');
    } finally {
      sendingRef.current = false;
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
