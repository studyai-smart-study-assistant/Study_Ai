
import { useState, useEffect, useCallback, useRef } from 'react';
import { chatDB } from '@/lib/db';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Message as MessageType } from '@/lib/db';
import { chatHandler } from '@/utils/enhancedChatHandler';
import { saveImageToGallery } from '@/lib/imageGalleryDB';
import { streamChatCompletion } from '@/lib/streamingChat';
import { useContextPrefetch } from './useContextPrefetch';
import { getRealtimeContext, isDateTimeQuery, getDateTimeAnswer } from '@/utils/realtimeContext';
import { supabase } from '@/integrations/supabase/client';

const GUEST_MESSAGE_LIMIT = 50;

export const useEnhancedChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [lastSources, setLastSources] = useState<Array<{ title: string; url: string }>>([]);
  const [agentStatus, setAgentStatus] = useState<{ status: string; text: string; tool?: string; provider?: string } | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const { currentUser, messageLimitReached, setMessageLimitReached } = useAuth();
  const { prefetched, prefetchContext, resetPrefetch } = useContextPrefetch();
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (chatId) {
      loadMessages();
      setLastSources([]);
      setStreamingContent('');
      setAgentStatus(null);
    }
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chat = await chatDB.getChat(chatId);
      if (chat) {
        setMessages(chat.messages || []);
        if (chat.title === "New Chat" && chat.messages?.length) {
          const first = chat.messages.find(m => m.role === 'user');
          if (first) await chatDB.updateChatTitle(chatId, first.content.slice(0, 30) + (first.content.length > 30 ? '...' : ''));
        }
        if (!currentUser && chat.messages?.filter(m => m.role === 'user').length! >= GUEST_MESSAGE_LIMIT) {
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

  const clearTimeoutGuard = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const enhancedSendMessage = useCallback(async (input: string, imageUrl?: string, skipAIResponse: boolean = false, reasoningMode: boolean = false) => {
    const normalizedImageUrl = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl : undefined;
    if ((!input.trim() && !normalizedImageUrl) || isLoading) return;

    if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      clearTimeoutGuard();
      activeRequestIdRef.current += 1;
      const requestId = activeRequestIdRef.current;

      setIsLoading(true);
      setIsResponding(true);
      setConnectionStatus('connected');
      setLastSources([]);
      setStreamingContent('');
      setAgentStatus(null);
      setMessages(prev => prev.filter(msg => !msg.id?.toString().startsWith('streaming-')));

      const isBase64Image = normalizedImageUrl?.startsWith('data:image/');
      const isBase64Pdf = normalizedImageUrl?.startsWith('data:application/pdf');
      let messageContent = input.trim();
      let imageBase64: string | undefined;

      if (isBase64Pdf && normalizedImageUrl) {
        messageContent = `[PDF_ATTACHED] 📄 ${messageContent || 'इस PDF के बारे में बताओ'}`;
        imageBase64 = normalizedImageUrl;
      } else if (isBase64Image && normalizedImageUrl) {
        const textPart = messageContent || 'इस image के बारे में बताओ';
        messageContent = `[IMG_DATA:${normalizedImageUrl}]${textPart}`;
        imageBase64 = normalizedImageUrl;
      } else if (normalizedImageUrl) {
        messageContent = messageContent ? `${messageContent}\n\n[Image: ${normalizedImageUrl}]` : `[Image: ${normalizedImageUrl}]`;
      }

      const userMessage = await chatDB.addMessage(chatId, messageContent, 'user');
      setMessages(prev => [...prev, userMessage]);

      const chat = await chatDB.getChat(chatId);
      if (chat?.title === "New Chat") {
        await chatDB.updateChatTitle(chatId, input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : ''));
      }
      if (onChatUpdated) onChatUpdated();

      if (skipAIResponse) {
        const botContent = normalizedImageUrl ? `[IMG_DATA:${normalizedImageUrl}]✨ Image बन गई!` : '✨ Image generated!';
        await chatDB.addMessage(chatId, botContent, 'bot');
        await loadMessages();
        setAgentStatus(null);
      } else {
        // Check for simple date/time queries
        const cleanPrompt = messageContent.replace(/^\[IMG_DATA:[^\]]+\]/, '').replace(/^\[PDF_ATTACHED\]\s*📄\s*/, '').trim() || 'इस image के बारे में बताओ';

        if (!imageBase64 && isDateTimeQuery(cleanPrompt)) {
          const answer = getDateTimeAnswer(cleanPrompt);
          await chatDB.addMessage(chatId, answer, 'bot');
          await loadMessages();
          setAgentStatus(null);
        } else {
          // Real streaming with Groq/Qwen
          const currentChat = await chatDB.getChat(chatId);
          const chatHistory = currentChat?.messages || [];

          const sanitize = (t: string) => (t || '').replace(/\[Image:\s*data:image\/[^\]]+\]/g, '[Image]').replace(/\[image:[^\]]+\]/gi, '[Image]').trim();
          const realtimeCtx = getRealtimeContext();

          const formattedHistory = chatHistory.slice(-30).map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : msg.role,
            content: sanitize(msg.content),
          }));

          let streamedText = '';
          const abortController = new AbortController();
          abortControllerRef.current = abortController;
          let hasReceivedStreamSignal = false;
          const timeoutMessage = 'No response received in 25 seconds. Please try again.';
          timeoutRef.current = window.setTimeout(() => {
            if (!hasReceivedStreamSignal && activeRequestIdRef.current === requestId) {
              abortController.abort();
              setAgentStatus(null);
              setConnectionStatus('disconnected');
              toast.error(timeoutMessage);
            }
          }, 25000);

          // Add a temporary streaming message
          const tempBotMsg: MessageType = {
            id: `streaming-${Date.now()}`,
            chatId,
            content: '',
            role: 'bot',
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, tempBotMsg]);

          await streamChatCompletion(
            {
              prompt: cleanPrompt,
              history: formattedHistory,
              imageBase64,
              reasoningMode,
              userContext: prefetched.ready ? prefetched.userContext : undefined,
              mindVaultContext: prefetched.ready ? prefetched.mindVaultContext : undefined,
            },
            {
              onToken: (text) => {
                if (activeRequestIdRef.current !== requestId) return;
                if (!hasReceivedStreamSignal) hasReceivedStreamSignal = true;
                streamedText += text;
                setStreamingContent(streamedText);
                // Update the temp bot message in real-time
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].id?.toString().startsWith('streaming-')) {
                    updated[lastIdx] = { ...updated[lastIdx], content: streamedText };
                  }
                  return updated;
                });
              },
              onStatus: (status, text, extra) => {
                if (activeRequestIdRef.current !== requestId) return;
                if (!hasReceivedStreamSignal) hasReceivedStreamSignal = true;
                setAgentStatus({ status, text, tool: extra?.tool, provider: extra?.provider });
                if (status === 'done') setAgentStatus(null);
              },
              onToolsUsed: (tools) => {
                if (activeRequestIdRef.current !== requestId) return;
                if (!hasReceivedStreamSignal) hasReceivedStreamSignal = true;
                const searchTools = tools.filter(t => t.name === 'web_search');
                if (searchTools.length) {
                  setLastSources(searchTools.map(t => ({ title: t.query || 'Web Search', url: '' })));
                }
              },
              onDone: () => {
                if (activeRequestIdRef.current !== requestId) return;
                if (!hasReceivedStreamSignal) hasReceivedStreamSignal = true;
                setAgentStatus(null);
                clearTimeoutGuard();
              },
              onError: (error) => {
                if (activeRequestIdRef.current !== requestId) return;
                console.error('Stream error:', error);
                toast.error(error);
                setAgentStatus(null);
                clearTimeoutGuard();
              },
            },
            abortController.signal
          );
          clearTimeoutGuard();

          // Save the final streamed response to DB
          if (streamedText) {
            await chatDB.addMessage(chatId, streamedText, 'bot');
          }

          // Reload to get proper DB messages
          await loadMessages();
          setStreamingContent('');
          resetPrefetch();
        }
      }

      if (onChatUpdated) onChatUpdated();

      if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT - 1) {
        setMessageLimitReached(true);
        setShowLimitAlert(true);
      }
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      setConnectionStatus('disconnected');
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error(error.message || 'Failed to send message', { duration: 5000 });
      }
      setMessages(prev => prev.filter(msg => !msg.id?.toString().startsWith('streaming-')));
    } finally {
      clearTimeoutGuard();
      setIsLoading(false);
      setIsResponding(false);
      setAgentStatus(null);
      abortControllerRef.current = null;
    }
  }, [chatId, currentUser, messages, isLoading, onChatUpdated, prefetched, resetPrefetch]);

  const sendMessage = enhancedSendMessage;

  const getChatStats = useCallback(() => chatHandler.getStats(), []);

  // Online/offline
  useEffect(() => {
    const on = () => setConnectionStatus('connected');
    const off = () => setConnectionStatus('disconnected');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => () => {
    clearTimeoutGuard();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages, isLoading, isResponding, showLimitAlert, setShowLimitAlert,
    loadMessages, sendMessage, enhancedSendMessage, messageLimitReached,
    connectionStatus, getChatStats, webSearchEnabled, setWebSearchEnabled,
    lastSources, agentStatus, streamingContent, prefetchContext,
  };
};
