
import { useState, useEffect, useRef } from 'react';
import { getGroupDetails, listenForMessages } from '@/lib/firebase';

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
