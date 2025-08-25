
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useChat } from '@/hooks/chat';
import ChatBody from './ChatBody';
import ChatFooter from '../ChatFooter';
import AlertHandler from './AlertHandler';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useScrollHandler } from '@/hooks/chat/useScrollHandler';

interface OptimizedChatContainerProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const OptimizedChatContainer: React.FC<OptimizedChatContainerProps> = ({ 
  chatId, 
  onChatUpdated 
}) => {
  const { 
    messages, 
    isLoading, 
    isResponding, 
    showLimitAlert, 
    setShowLimitAlert, 
    loadMessages, 
    sendMessage,
    messageLimitReached
  } = useChat(chatId, onChatUpdated);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useScrollHandler(messagesEndRef);

  // Memoize message handlers to prevent unnecessary re-renders
  const { 
    handleSend, 
    handleMessageEdited, 
    handleMessageDeleted 
  } = useMessageHandler({
    chatId,
    loadMessages,
    onChatUpdated,
    scrollToBottom,
    sendMessage
  });

  // Memoize alert close handler
  const handleAlertClose = useCallback(() => {
    setShowLimitAlert(false);
  }, [setShowLimitAlert]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Memoize props to prevent child re-renders
  const chatBodyProps = useMemo(() => ({
    messages,
    isLoading,
    isResponding,
    onMessageEdited: handleMessageEdited,
    onMessageDeleted: handleMessageDeleted,
    onSendMessage: handleSend,
    messagesEndRef
  }), [messages, isLoading, isResponding, handleMessageEdited, handleMessageDeleted, handleSend]);

  const chatFooterProps = useMemo(() => ({
    onSend: handleSend,
    isLoading,
    isDisabled: isResponding || messageLimitReached
  }), [handleSend, isLoading, isResponding, messageLimitReached]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 w-full overflow-hidden">
      <AlertHandler 
        showLimitAlert={showLimitAlert} 
        onClose={handleAlertClose} 
      />
      
      <ChatBody {...chatBodyProps} />
      
      <ChatFooter {...chatFooterProps} />
    </div>
  );
};

export default React.memo(OptimizedChatContainer);
