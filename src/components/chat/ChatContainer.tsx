
import React, { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/chat';
import ChatBody from './ChatBody';
import ChatFooter from '../ChatFooter';
import AlertHandler from './AlertHandler';
import { useMessageHandler } from '@/hooks/chat/useMessageHandler';
import { useScrollHandler } from '@/hooks/chat/useScrollHandler';

interface ChatContainerProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ chatId, onChatUpdated }) => {
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
    sendMessage
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 w-full overflow-hidden">
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

export default ChatContainer;
