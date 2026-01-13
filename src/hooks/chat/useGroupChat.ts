
import { useState, useEffect, useRef } from 'react';
import { getGroupDetails, listenForMessages } from '@/lib/supabase/chat-functions';

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
