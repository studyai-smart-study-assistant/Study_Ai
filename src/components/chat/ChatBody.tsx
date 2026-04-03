
import React from 'react';
import MessageList from './MessageList';
import EmptyChatState from './EmptyChatState';
import AgentStatusIndicator from './AgentStatusIndicator';

interface ChatBodyProps {
  messages: any[];
  isLoading: boolean;
  isResponding: boolean;
  onMessageEdited: () => void;
  onMessageDeleted: () => void;
  onSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onEditImage?: (imageUrl: string, originalPrompt: string) => void;
  agentStatus?: { status: string; text: string; tool?: string; provider?: string } | null;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  messages, isLoading, isResponding, onMessageEdited, onMessageDeleted,
  onSendMessage, messagesEndRef, onEditImage, agentStatus
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
            onEditImage={onEditImage}
          />
          
          {/* Real agent status - not fake */}
          {agentStatus && (
            <AgentStatusIndicator status={agentStatus.status} text={agentStatus.text} tool={agentStatus.tool} provider={agentStatus.provider} />
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatBody;
