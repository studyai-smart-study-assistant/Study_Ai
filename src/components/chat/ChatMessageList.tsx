
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

  const handleMessageDeleted = (messageId: string) => {
    console.log("Message deleted:", messageId);
    onMessageUpdated();
  };

  const handleMessageFeedback = (messageId: string, rating: 'like' | 'dislike') => {
    console.log("Message feedback:", messageId, rating);
    onMessageUpdated();
  };

  if (!messages || messages.length === 0) {
    return <EmptyMessageState />;
  }

  return (
    <>
      {messages.map((msg) =>
        msg && (
          <MessageItem
            key={msg.id}
            message={msg}
            isGroup={isGroup}
            onMessageDeleted={handleMessageDeleted}
            onMessageFeedback={handleMessageFeedback}
          />
        )
      )}
    </>
  );
});

ChatMessageList.displayName = 'ChatMessageList';

export default ChatMessageList;
