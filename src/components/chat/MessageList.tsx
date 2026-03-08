
import React from 'react';
import { Message as MessageType } from '@/lib/db';
import Message from './Message';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  onMessageEdited: () => void;
  onMessageDeleted: () => void;
  onEditImage?: (imageUrl: string, originalPrompt: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onMessageEdited, 
  onMessageDeleted,
  onEditImage
}) => {
  return (
    <div className="pb-36 sm:pb-48 w-full max-w-full overflow-hidden space-y-4">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          onEdited={onMessageEdited}
          onDeleted={onMessageDeleted}
          onEditImage={onEditImage}
        />
      ))}
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
