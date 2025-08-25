
import React from 'react';
import MessageList from './MessageList';
import EmptyChatState from './EmptyChatState';
import EnhancedLoadingAnimation from '../ui/enhanced-loading-animation';

interface ChatBodyProps {
  messages: any[];
  isLoading: boolean;
  isResponding: boolean;
  onMessageEdited: () => void;
  onMessageDeleted: () => void;
  onSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  messages,
  isLoading,
  isResponding,
  onMessageEdited,
  onMessageDeleted,
  onSendMessage,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
      {messages.length === 0 ? (
        <EmptyChatState onSendMessage={onSendMessage} />
      ) : (
        <>
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            onMessageEdited={onMessageEdited}
            onMessageDeleted={onMessageDeleted}
          />
          
          {/* Enhanced loading animation with status message */}
          {(isLoading || isResponding) && (
            <div className="flex flex-col items-center justify-center py-6 px-2">
              <EnhancedLoadingAnimation 
                message={isResponding ? "Study AI विचार कर रहा है..." : "संदेश लोड हो रहे हैं..."}
                className="my-2" 
              />
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatBody;
