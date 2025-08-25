
import React, { memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import MessageActions from './MessageActions';

interface MessageItemProps {
  message: any;
  isGroup: boolean;
  chatId: string;
  activeMessageId: string | null;
  currentTime: number;
  onMessageClick: (messageId: string) => void;
  onMessageUpdated: () => void;
}

const MessageItem = memo(({ 
  message: msg, 
  isGroup, 
  chatId, 
  activeMessageId, 
  currentTime,
  onMessageClick,
  onMessageUpdated 
}: MessageItemProps) => {
  const { currentUser } = useAuth();
  
  const formatMessageTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'HH:mm');
  };
  
  const isImageMessage = (text: string) => {
    return text?.startsWith('[image:') && text?.endsWith(']');
  };
  
  const extractImageUrl = (text: string) => {
    if (isImageMessage(text)) {
      return text.substring(7, text.length - 1);
    }
    return '';
  };

  const getExpirationTime = (expiresAt: number) => {
    if (!expiresAt) return null;
    
    const timeLeft = expiresAt - currentTime;
    
    if (timeLeft <= 0) return "समाप्त होने वाला";
    
    if (timeLeft < 60 * 60 * 1000) {
      const minutesLeft = Math.floor(timeLeft / (60 * 1000));
      return `${minutesLeft} मिनट शेष`;
    }
    
    if (timeLeft < 24 * 60 * 60 * 1000) {
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return `${hoursLeft}घं ${minutesLeft}मि शेष`;
    }
    
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    return `${Math.floor(hoursLeft / 24)}दिन ${hoursLeft % 24}घं शेष`;
  };

  const isCurrentUser = msg.sender === currentUser?.uid;
  const isImage = isImageMessage(msg.text);
  const imageUrl = isImage ? extractImageUrl(msg.text) : '';
  const isSaved = msg.saved === true;
  const isExpiringSoon = msg.expiresAt && !isSaved && 
    (msg.expiresAt - currentTime < 4 * 60 * 60 * 1000);
  const isTemp = msg.isTemp === true;
  const expirationTimeText = getExpirationTime(msg.expiresAt);
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div 
        className={`relative max-w-[75%] rounded-2xl p-3 ${
          isCurrentUser 
            ? 'bg-purple-500 text-white rounded-br-none' 
            : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
        } ${isSaved ? 'border-l-4 border-amber-500' : ''}
          ${isExpiringSoon ? 'border-red-500 border' : ''}
          ${isTemp ? 'opacity-70' : 'opacity-100'} shadow-sm`}
        onClick={() => !isTemp && onMessageClick(msg.id)}
      >
        {isGroup && (
          <div className={`text-xs font-semibold mb-1 ${
            isCurrentUser ? 'text-purple-100' : 'text-gray-600 dark:text-gray-300'
          }`}>
            {isCurrentUser ? 'You' : msg.senderName}
          </div>
        )}
        
        {isTemp ? (
          <div className="flex items-center space-x-2">
            <div className="whitespace-pre-wrap">{msg.text}</div>
            <div className="animate-pulse w-3 h-3 bg-white rounded-full"></div>
          </div>
        ) : isImage ? (
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={imageUrl} 
              alt="Shared image" 
              className="max-h-60 rounded"
              loading="lazy"
            />
          </a>
        ) : (
          <div className="whitespace-pre-wrap">{msg.text}</div>
        )}
        
        <div 
          className={`text-xs ${
            isCurrentUser ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
          } text-right mt-1 flex justify-end items-center space-x-2`}
        >
          <span>{formatMessageTimestamp(msg.timestamp)}</span>
          {!isSaved && !isTemp && expirationTimeText && (
            <span className={`text-xs ${isCurrentUser ? 'text-purple-100' : 'text-red-400'}`}>
              {expirationTimeText}
            </span>
          )}
        </div>

        {!isTemp && activeMessageId === msg.id && (
          <MessageActions 
            messageId={msg.id}
            chatId={chatId}
            isGroup={isGroup}
            isSaved={isSaved}
            onActionComplete={onMessageUpdated}
          />
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
