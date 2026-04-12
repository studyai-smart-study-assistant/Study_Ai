import { useState, useEffect, useCallback } from 'react';
import { supabaseChatRepo } from '@/lib/chat/supabase-chat-repo';
import { generateResponse } from '@/lib/gemini';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Message as MessageType } from '@/lib/db';

const GUEST_MESSAGE_LIMIT = 50;
const AI_RESPONSE_TIMEOUT_MS = 50000;
const FALLBACK_BOT_MESSAGE = 'मुझे अभी जवाब देने में कठिनाई हो रही है। कृपया कुछ समय बाद पुनः प्रयास करें।';
const PAGE_SIZE = 30;

export const useChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { currentUser, messageLimitReached, setMessageLimitReached } = useAuth();

  useEffect(() => {
    setActiveChatId(chatId);
  }, [chatId]);

  const loadMessages = useCallback(async () => {
    if (!activeChatId) return;

    try {
      setIsLoading(true);
      const page = await supabaseChatRepo.getMessagesPage(activeChatId, { limit: PAGE_SIZE });
      setMessages(page.messages);
      setHasOlderMessages(page.hasMore);
      setNextCursor(page.nextCursor);

      if (!currentUser && page.messages.filter((m) => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
        setMessageLimitReached(true);
        setShowLimitAlert(true);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [activeChatId, currentUser, setMessageLimitReached]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = supabaseChatRepo.subscribeToMessages(activeChatId, loadMessages);
    return unsubscribe;
  }, [activeChatId, loadMessages]);


  const loadOlderMessages = useCallback(async () => {
    if (!activeChatId || !nextCursor) return;

    const page = await supabaseChatRepo.getMessagesPage(activeChatId, { limit: PAGE_SIZE, before: nextCursor });
    setMessages((prev) => [...page.messages, ...prev]);
    setHasOlderMessages(page.hasMore);
    setNextCursor(page.nextCursor);
  }, [activeChatId, nextCursor]);

  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading || isResponding) return;

    if (!currentUser && messages.filter((m) => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    let fallbackChatId = activeChatId;
    try {
      setIsLoading(true);
      setIsResponding(true);
      let nextChatId = activeChatId;
      let currentChat = await supabaseChatRepo.getChat(nextChatId);

      if (!currentChat) {
        const newChat = await supabaseChatRepo.createNewChat();
        nextChatId = newChat.id;
        fallbackChatId = newChat.id;
        setActiveChatId(newChat.id);
        currentChat = newChat;
      }

      fallbackChatId = nextChatId;
      const userMessage = await supabaseChatRepo.addMessage(nextChatId, input.trim(), 'user');
      setMessages((prev) => [...prev, userMessage]);

      if (onChatUpdated) onChatUpdated();

      const historyPage = await supabaseChatRepo.getMessagesPage(nextChatId, { limit: 30 });
      const chatHistory = historyPage.messages || [];

      await Promise.race([
        generateResponse(input.trim(), chatHistory, nextChatId),
        new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('AI response timed out in useChat.')), AI_RESPONSE_TIMEOUT_MS);
        }),
      ]);

      if (onChatUpdated) onChatUpdated();

      if (!currentUser && messages.filter((m) => m.role === 'user').length >= GUEST_MESSAGE_LIMIT - 1) {
        setMessageLimitReached(true);
        setShowLimitAlert(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const refreshedPage = await supabaseChatRepo.getMessagesPage(fallbackChatId, { limit: 1 });
      const lastMessage = refreshedPage.messages[refreshedPage.messages.length - 1];

      if (fallbackChatId && lastMessage?.content !== FALLBACK_BOT_MESSAGE) {
        await supabaseChatRepo.addMessage(fallbackChatId, FALLBACK_BOT_MESSAGE, 'bot');
      }

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
    messageLimitReached,
    hasOlderMessages,
    loadOlderMessages,
  };
};
