import { useState, useEffect, useCallback } from 'react';
import { supabaseChatRepo } from '@/lib/chat/supabase-chat-repo';
import { Message as MessageType } from '@/lib/db';
import { toast } from 'sonner';

const PAGE_SIZE = 30;

export const useChatData = (chatId: string) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadLatestMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      setIsLoading(true);
      const chat = await supabaseChatRepo.getChat(chatId, PAGE_SIZE);
      if (chat) {
        setDisplayName(chat.title || 'Chat');
      }

      const page = await supabaseChatRepo.getMessagesPage(chatId, { limit: PAGE_SIZE });
      setMessages(page.messages);
      setHasOlderMessages(page.hasMore);
      setNextCursor(page.nextCursor);
      setLoadError(null);
    } catch (error) {
      toast.error('Failed to load messages');
      setLoadError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadLatestMessages();
  }, [loadLatestMessages]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = supabaseChatRepo.subscribeToMessages(chatId, () => {
      loadLatestMessages();
    });

    return unsubscribe;
  }, [chatId, loadLatestMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (!chatId || !nextCursor || isLoadingOlder) return;

    try {
      setIsLoadingOlder(true);
      const page = await supabaseChatRepo.getMessagesPage(chatId, {
        limit: PAGE_SIZE,
        before: nextCursor,
      });

      setMessages((prev) => [...page.messages, ...prev]);
      setHasOlderMessages(page.hasMore);
      setNextCursor(page.nextCursor);
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingOlder(false);
    }
  }, [chatId, nextCursor, isLoadingOlder]);

  return {
    messages,
    isLoading,
    isLoadingOlder,
    hasOlderMessages,
    loadOlderMessages,
    displayName,
    groupDetails,
    setGroupDetails,
    loadError,
    setMessages,
    refreshMessages: loadLatestMessages,
  };
};
