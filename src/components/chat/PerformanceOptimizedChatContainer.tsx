
import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useChat } from '@/hooks/chat';
import ChatBody from './ChatBody';
import ChatFooter from '../ChatFooter';
import AlertHandler from './AlertHandler';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useScrollHandler } from '@/hooks/chat/useScrollHandler';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface PerformanceOptimizedChatContainerProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const PerformanceOptimizedChatContainer: React.FC<PerformanceOptimizedChatContainerProps> = ({ 
  chatId, 
  onChatUpdated 
}) => {
  const performanceMetrics = usePerformanceMonitor('ChatContainer');
  const [isVisible, setIsVisible] = useState(true);
  
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

  // Optimize message handlers with better memoization
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

  // Optimized scroll to bottom with throttling
  const throttledScrollToBottom = useCallback(() => {
    if (isVisible && document.body.dataset.allowScroll === 'true') {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [scrollToBottom, isVisible]);

  // Scroll to bottom when messages change (but respect scroll permissions)
  useEffect(() => {
    throttledScrollToBottom();
  }, [messages, throttledScrollToBottom]);

  // Visibility API to pause updates when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Prevent initial auto-scroll
  useEffect(() => {
    document.body.dataset.allowScroll = 'false';
    const timer = setTimeout(() => {
      document.body.dataset.allowScroll = 'true';
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Memoize props to prevent unnecessary re-renders
  const chatBodyProps = useMemo(() => ({
    messages: isVisible ? messages : messages.slice(0, 50), // Limit messages when not visible
    isLoading,
    isResponding,
    onMessageEdited: handleMessageEdited,
    onMessageDeleted: handleMessageDeleted,
    onSendMessage: handleSend,
    messagesEndRef
  }), [messages, isLoading, isResponding, handleMessageEdited, handleMessageDeleted, handleSend, isVisible]);

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
      
      {/* Performance debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          Renders: {performanceMetrics.renderCount} | 
          Avg: {performanceMetrics.averageRenderTime.toFixed(2)}ms
        </div>
      )}
    </div>
  );
};

export default React.memo(PerformanceOptimizedChatContainer);
