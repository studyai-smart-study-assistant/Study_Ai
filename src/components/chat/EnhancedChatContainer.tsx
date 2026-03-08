
import React, { useRef, useEffect } from 'react';
import { useEnhancedChat } from '@/hooks/chat/useEnhancedChat';
import ChatBody from './ChatBody';
import ChatFooter from '../ChatFooter';
import AlertHandler from './AlertHandler';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useScrollHandler } from '@/hooks/chat/useScrollHandler';
import WebSearchSources from '../message/WebSearchSources';

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
    getChatStats,
    webSearchEnabled,
    setWebSearchEnabled,
    lastSources
  } = useEnhancedChat(chatId, onChatUpdated);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useScrollHandler(messagesEndRef);

  const { 
    handleSend, 
    handleMessageEdited, 
    handleMessageDeleted 
  } = useMessageHandler({
    chatId,
    loadMessages,
    onChatUpdated,
    scrollToBottom,
    sendMessage: enhancedSendMessage
  });

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

      {/* Show sources after the last bot message when web search was used */}
      {lastSources.length > 0 && !isResponding && (
        <div className="px-4 sm:px-8 max-w-[760px] mx-auto w-full">
          <WebSearchSources sources={lastSources} />
        </div>
      )}
      
      <ChatFooter 
        onSend={handleSend} 
        isLoading={isLoading} 
        isDisabled={isResponding || messageLimitReached}
        webSearchEnabled={webSearchEnabled}
        onWebSearchToggle={setWebSearchEnabled}
      />
    </div>
  );
};

export default EnhancedChatContainer;
