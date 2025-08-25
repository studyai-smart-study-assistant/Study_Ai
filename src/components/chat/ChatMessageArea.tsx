
import React, { useRef, useEffect } from 'react';
import AnimatedMessage from './AnimatedMessage';
import EnhancedLoadingAnimation from '../ui/enhanced-loading-animation';

interface ChatMessageAreaProps {
  messages: any[];
  isLoading: boolean;
  chatId: string;
  isGroup: boolean;
  onRefreshMessages: () => void;
}

const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  messages,
  isLoading,
  chatId,
  isGroup,
  onRefreshMessages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EnhancedLoadingAnimation message="संदेश लोड हो रहे हैं..." />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            💬
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {isGroup ? 'Group Chat Created!' : 'Start Conversation'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isGroup 
                ? 'Welcome to your new group! Send a message to get started.'
                : 'Send your first message to begin the conversation.'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((message, index) => (
            <AnimatedMessage
              key={message.id || index}
              message={message}
              isGroup={isGroup}
              onMessageUpdated={onRefreshMessages}
            />
          ))}
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg animate-bounce">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  भेजा जा रहा है...
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageArea;
