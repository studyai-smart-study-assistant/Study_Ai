
import React, { useRef, useEffect, useState } from 'react';
import { useEnhancedChat } from '@/hooks/chat/useEnhancedChat';
import ChatBody from './ChatBody';
import ChatFooter from '../ChatFooter';
import AlertHandler from './AlertHandler';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useScrollHandler } from '@/hooks/chat/useScrollHandler';

interface EnhancedChatContainerProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const EnhancedChatContainer: React.FC<EnhancedChatContainerProps> = ({ 
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
    messageLimitReached,
    enhancedSendMessage,
    getChatStats
  } = useEnhancedChat(chatId, onChatUpdated);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useScrollHandler(messagesEndRef);

  // Set up message handlers
  const { 
    handleSend, 
    handleMessageEdited, 
    handleMessageDeleted 
  } = useMessageHandler({
    chatId,
    loadMessages,
    onChatUpdated,
    scrollToBottom,
    sendMessage: enhancedSendMessage // Use enhanced send message
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 w-full overflow-hidden relative">
      <AlertHandler 
        showLimitAlert={showLimitAlert} 
        onClose={() => setShowLimitAlert(false)} 
      />
      
      <ChatBody
        messages={messages}
        isLoading={isLoading}
        isResponding={isResponding}
        onMessageEdited={handleMessageEdited}
        onMessageDeleted={handleMessageDeleted}
        onSendMessage={handleSend}
        messagesEndRef={messagesEndRef}
      />
      
      <ChatFooter 
        onSend={handleSend} 
        isLoading={isLoading} 
        isDisabled={isResponding || messageLimitReached}
      />
    </div>
  );
};

export default EnhancedChatContainer;
