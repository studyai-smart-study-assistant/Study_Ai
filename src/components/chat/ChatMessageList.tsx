
import { useEffect, useRef, useState, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MessageItem from './MessageItem';
import EmptyMessageState from './EmptyMessageState';

interface ChatMessageListProps {
  messages: any[];
  isGroup: boolean;
  chatId: string;
  onMessageUpdated: () => void;
}

const ChatMessageList = memo(({ messages, isGroup, chatId, onMessageUpdated }: ChatMessageListProps) => {
  const { currentUser } = useAuth();
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  
  // Update current time every minute to refresh expiration countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const handleMessageClick = (messageId: string) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    setActiveMessageId(messageId);

    messageTimerRef.current = window.setTimeout(() => {
      setActiveMessageId(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  if (messages.length === 0) {
    return <EmptyMessageState />;
  }

  return (
    <>
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isGroup={isGroup}
          chatId={chatId}
          activeMessageId={activeMessageId}
          currentTime={currentTime}
          onMessageClick={handleMessageClick}
          onMessageUpdated={onMessageUpdated}
        />
      ))}
    </>
  );
});

ChatMessageList.displayName = 'ChatMessageList';

export default ChatMessageList;
