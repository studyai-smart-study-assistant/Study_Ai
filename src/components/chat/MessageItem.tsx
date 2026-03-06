import React, { memo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import LongPressMenu from '@/components/message/LongPressMenu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: any;
  isGroup: boolean;
  onMessageDeleted: (messageId: string) => void;
  onMessageFeedback: (messageId: string, rating: 'like' | 'dislike') => void;
}

const MessageItem = memo(({ 
  message: msg, 
  isGroup, 
  onMessageDeleted,
  onMessageFeedback
}: MessageItemProps) => {
  const { currentUser } = useAuth();

  const isCurrentUser = msg.sender === currentUser?.uid;

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success("Message copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy message.");
      console.error("Copy failed", err);
    });
  }, []);

  const messageForMenu = {
      id: msg.id,
      content: msg.text,
      isUser: isCurrentUser
  };

  return (
    <LongPressMenu
        message={messageForMenu}
        onCopy={handleCopy}
        onDelete={onMessageDeleted}
        onFeedback={onMessageFeedback}
        isLiked={msg.isLiked}
    >
        <div className={cn("flex mb-3", isCurrentUser ? 'justify-end' : 'justify-start')}>
            <div 
                className={cn(
                    "relative max-w-[75%] rounded-2xl p-3 shadow-sm",
                    isCurrentUser 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-muted rounded-bl-none',
                    msg.isTemp && 'opacity-60'
                )}
            >
                {isGroup && !isCurrentUser && (
                    <div className="text-xs font-semibold mb-1 text-secondary-foreground/70">
                        {msg.senderName || 'User'}
                    </div>
                )}
                
                <div className="whitespace-pre-wrap break-words">
                    {msg.text}
                </div>
                
                <div className={cn("text-xs mt-1 flex justify-end items-center", isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                    {format(new Date(msg.timestamp || Date.now()), 'HH:mm')}
                </div>
            </div>
        </div>
    </LongPressMenu>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
