
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Heart, Bookmark, Copy, Edit3, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnimatedMessageProps {
  message: any;
  isGroup: boolean;
  onMessageUpdated: () => void;
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({
  message,
  isGroup,
  onMessageUpdated
}) => {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = message.sender === currentUser?.uid;
  const isImage = message.text?.startsWith('[image:') && message.text?.endsWith(']');
  const imageUrl = isImage ? message.text.substring(7, message.text.length - 1) : '';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div
      className={cn(
        "flex mb-4 transition-all duration-500 transform",
        isCurrentUser ? "justify-end" : "justify-start",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn("flex max-w-[80%] items-end gap-2", isCurrentUser && "flex-row-reverse")}>
        {/* Avatar for group chats */}
        {isGroup && !isCurrentUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-scale-in">
            {getInitials(message.senderName)}
          </div>
        )}

        <div className="flex flex-col">
          {/* Sender name in groups */}
          {isGroup && !isCurrentUser && (
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2 animate-fade-in">
              {message.senderName}
            </span>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl",
              isCurrentUser
                ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-br-md"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700",
              "animate-scale-in"
            )}
          >
            {/* Message content */}
            {isImage ? (
              <div className="animate-fade-in">
                <img
                  src={imageUrl}
                  alt="Shared image"
                  className="max-w-60 max-h-60 rounded-lg object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="whitespace-pre-wrap animate-fade-in">
                {message.text}
              </div>
            )}

            {/* Timestamp */}
            <div className={cn(
              "text-xs mt-1 opacity-70",
              isCurrentUser ? "text-purple-100" : "text-gray-500"
            )}>
              {formatTime(message.timestamp)}
            </div>

            {/* Message actions */}
            {showActions && (
              <div className={cn(
                "absolute top-0 flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border animate-fade-in",
                isCurrentUser ? "-left-20" : "-right-20"
              )}>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Heart className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Bookmark className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
                {isCurrentUser && (
                  <>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedMessage;
