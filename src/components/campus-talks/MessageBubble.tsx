import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Edit2, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  text_content?: string;
  image_path?: string;
  message_type: 'text' | 'image';
  created_at: string;
  edited_at?: string;
  reactions?: Record<string, string[]>;
  reply_to_id?: string;
  reply_to_message?: {
    id: string;
    sender_id: string;
    text_content?: string;
    message_type: 'text' | 'image';
  };
  sender?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  onReaction: (emoji: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onContextMenu,
  onReaction
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Handle long press for mobile devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimeoutRef.current = setTimeout(() => {
      // Create a synthetic mouse event for the context menu
      const syntheticEvent = {
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent;
      
      onContextMenu(syntheticEvent);
    }, 500); // 500ms long press
  }, [onContextMenu]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    touchStartRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current && longPressTimeoutRef.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      
      // Cancel long press if user moves finger too much
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getReactionCount = (emoji: string) => {
    return message.reactions?.[emoji]?.length || 0;
  };

  const hasUserReacted = (emoji: string, userId: string) => {
    return message.reactions?.[emoji]?.includes(userId) || false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring",
        damping: 20,
        stiffness: 200,
        duration: 0.4
      }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-4 message-bubble-slide-in`}
    >
      <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
        {!isOwn && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Avatar className="w-10 h-10 mb-2 ring-2 ring-primary/20 shadow-glow">
              <AvatarImage src={message.sender?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white text-sm font-bold shadow-lg">
                {message.sender?.display_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '👤'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        )}
        
        <div className={`space-y-2 ${isOwn ? 'mr-3' : 'ml-3'}`}>
          {/* Reply Reference */}
          {message.reply_to_message && (
            <motion.div 
              initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 bg-muted/50 backdrop-blur-sm rounded-2xl border-l-4 border-primary ${isOwn ? 'mr-4' : 'ml-4'} shadow-message`}
            >
              <p className="text-xs text-primary font-semibold mb-1">
                Reply to {message.reply_to_message.sender_id}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {message.reply_to_message.message_type === 'image' ? '📷 Image' : message.reply_to_message.text_content}
              </p>
            </motion.div>
          )}
          
          {/* Message Bubble */}
          <motion.div
            onContextMenu={onContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onDoubleClick={() => setShowReactions(!showReactions)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative px-5 py-3 rounded-3xl cursor-pointer transition-all duration-300 backdrop-blur-sm shadow-message ${
              isOwn
                ? 'bg-gradient-message-own text-primary-foreground rounded-br-lg'
                : 'bg-gradient-message-other text-foreground rounded-bl-lg border border-border/50'
            } hover:shadow-elegant group-hover:scale-[1.01] select-none`}
          >
            {message.message_type === 'text' ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.text_content}
              </p>
            ) : (
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img
                  src={message.image_path}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-2xl border border-border/30 shadow-lg"
                  style={{ maxHeight: '320px' }}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            )}
            
            {/* Quick Reactions */}
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-16 bg-background/95 backdrop-blur-xl rounded-2xl p-3 shadow-elegant border border-border/50 flex space-x-2`}
              >
                {commonEmojis.map((emoji, index) => (
                  <motion.button
                    key={emoji}
                    onClick={() => {
                      onReaction(emoji);
                      setShowReactions(false);
                    }}
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-secondary/80 rounded-xl p-2 text-xl transition-all duration-200 hover:shadow-glow"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
          
          {/* Reactions Display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <motion.div 
              className={`flex flex-wrap gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Object.entries(message.reactions).map(([emoji, users]) => 
                users.length > 0 ? (
                  <motion.button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-secondary/80 hover:bg-secondary backdrop-blur-sm rounded-full px-3 py-1.5 text-xs flex items-center space-x-1.5 transition-all duration-200 border border-border/30 shadow-sm hover:shadow-message"
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-muted-foreground font-medium">{users.length}</span>
                  </motion.button>
                ) : null
              )}
            </motion.div>
          )}
          
          {/* Message Info */}
          <div className={`flex items-center space-x-2 text-xs text-muted-foreground ${isOwn ? 'justify-end' : 'justify-start'} mt-1`}>
            <span className="font-medium">{formatTime(message.created_at)}</span>
            {message.edited_at && (
              <motion.div 
                className="flex items-center space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Edit2 className="w-3 h-3" />
                <span>edited</span>
              </motion.div>
            )}
            {isOwn && (
              <motion.div 
                className="flex items-center"
                whileHover={{ scale: 1.1 }}
              >
                <CheckCheck className="w-4 h-4 text-primary" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;