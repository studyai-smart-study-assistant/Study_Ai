import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MessageBubble from './MessageBubble';
import MessageContextMenu from './MessageContextMenu';
import EmojiPicker from './EmojiPicker';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
  showBackButton?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack, showBackButton = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    messageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    chatInfo,
    loading,
    sendMessage,
    sendImage,
    editMessage,
    deleteMessage,
    addReaction,
    replyToMessage
  } = useChatMessages(chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      if (replyingTo) {
        await replyToMessage(replyingTo, message.trim());
        setReplyingTo(null);
      } else {
        await sendMessage(message.trim());
      }
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await sendImage(file);
      } catch (error) {
        console.error('Error sending image:', error);
      }
    }
  };

  const handleMessageContextMenu = (messageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      messageId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    setContextMenu(null);
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
      setContextMenu(null);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleForward = (messageId: string) => {
    // For now, just show a toast - in a real app you'd open a forward dialog
    toast.success('Forward functionality - select contacts to forward to');
    setContextMenu(null);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const replyingToMessage = replyingTo ? messages.find(m => m.id === replyingTo) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chatInfo?.participant?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {getInitials(chatInfo?.participant?.display_name || chatInfo?.name)}
              </AvatarFallback>
            </Avatar>
            {chatInfo?.participant?.status === 'online' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {chatInfo?.participant?.display_name || chatInfo?.name || 'Unknown'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chatInfo?.participant?.status === 'online' ? 'Online' : 
               chatInfo?.participant?.last_seen ? `Last seen ${formatDistanceToNow(new Date(chatInfo.participant.last_seen), { addSuffix: true })}` : 
               'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👋</div>
              <p className="text-gray-500 dark:text-gray-400">
                Start the conversation with a message!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUser?.uid}
                onContextMenu={(e) => handleMessageContextMenu(msg.id, e)}
                onReaction={(emoji) => handleReaction(msg.id, emoji)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyingToMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mx-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Replying to {replyingToMessage.sender_id === currentUser?.uid ? 'yourself' : 'them'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {replyingToMessage.text_content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="text-gray-500"
            >
              ×
            </Button>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/20 dark:border-gray-700/30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg">
        <div className="flex items-end space-x-2">
          <div className="flex space-x-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-600 rounded-full"
            />
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setMessage(message + emoji);
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="rounded-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          messageId={contextMenu.messageId}
          messageContent={messages.find(m => m.id === contextMenu.messageId)?.text_content || ''}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReaction={handleReaction}
          onForward={handleForward}
          canEdit={messages.find(m => m.id === contextMenu.messageId)?.sender_id === currentUser?.uid}
          canDelete={messages.find(m => m.id === contextMenu.messageId)?.sender_id === currentUser?.uid}
        />
      )}
    </div>
  );
};

export default ChatWindow;