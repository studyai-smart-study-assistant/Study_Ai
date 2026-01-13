
import { useState, useEffect, useRef } from 'react';
import { chatDB, Message as MessageType } from '@/lib/db';
import { generateResponse } from '@/lib/gemini';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { getGroupDetails, listenForMessages } from '@/lib/supabase/chat-functions';

const GUEST_MESSAGE_LIMIT = 2;

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
        if (chat) { setMessages(chat.messages || []); setDisplayName(chat.title || 'Chat'); }
      } catch { toast.error('Failed to load messages'); setLoadError('Failed to load messages'); }
      finally { setIsLoading(false); }
    };
    if (chatId) loadMessages();
  }, [chatId]);

  const refreshMessages = async () => {
    try { const chat = await chatDB.getChat(chatId); if (chat) setMessages(chat.messages || []); } catch {}
  };

  return { messages, isLoading, displayName, groupDetails, loadError, setMessages, refreshMessages };
};

export const useChat = (chatId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const { currentUser, messageLimitReached, setMessageLimitReached } = useAuth();

  useEffect(() => { if (chatId) loadMessages(); }, [chatId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chat = await chatDB.getChat(chatId);
      if (chat) {
        setMessages(chat.messages || []);
        if (chat.title === "New Chat" && chat.messages?.length > 0) {
          const firstUserMessage = chat.messages.find(m => m.role === 'user');
          if (firstUserMessage) await chatDB.updateChatTitle(chatId, firstUserMessage.content.slice(0, 30));
        }
        if (!currentUser && chat.messages?.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
          setMessageLimitReached(true);
          setShowLimitAlert(true);
        }
      }
    } catch { toast.error('Failed to load messages'); }
    finally { setIsLoading(false); }
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading || isResponding) return;
    if (!currentUser && messages.filter(m => m.role === 'user').length >= GUEST_MESSAGE_LIMIT) {
      setMessageLimitReached(true);
      setShowLimitAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setIsResponding(true);
      const userMessage = await chatDB.addMessage(chatId, input.trim(), 'user');
      setMessages(prev => [...prev, userMessage]);
      
      const chat = await chatDB.getChat(chatId);
      if (chat?.title === "New Chat") await chatDB.updateChatTitle(chatId, input.trim().slice(0, 30));
      if (onChatUpdated) onChatUpdated();
      
      const chatHistory = chat?.messages || [];
      await generateResponse(input.trim(), chatHistory, chatId);
      await loadMessages();
      if (onChatUpdated) onChatUpdated();
    } catch { toast.error('Failed to send message'); }
    finally { setIsLoading(false); setIsResponding(false); }
  };

  return { messages, isLoading, isResponding, showLimitAlert, setShowLimitAlert, loadMessages, sendMessage, messageLimitReached };
};

export const useGroupChat = (groupId: string, onChatUpdated?: () => void) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const messagesRef = useRef<any[]>([]);
  const unsubscribeRef = useRef<any>(null);
  
  useEffect(() => {
    if (!groupId) return;
    getGroupDetails(groupId).then(setGroupDetails).catch(() => {});
  }, [groupId]);
  
  useEffect(() => {
    if (!groupId) return;
    setIsLoading(true);
    
    const callback = (newMessages: any[]) => {
      if (JSON.stringify(newMessages) !== JSON.stringify(messagesRef.current)) {
        messagesRef.current = newMessages;
        setMessages(newMessages);
        setIsLoading(false);
        if (onChatUpdated) onChatUpdated();
      } else { setIsLoading(false); }
    };
    
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = listenForMessages(groupId, true, callback);
    
    return () => { if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; } };
  }, [groupId, onChatUpdated]);
  
  return { messages, isLoading, groupDetails };
};
