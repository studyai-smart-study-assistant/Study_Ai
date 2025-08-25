import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Plus, MoreVertical, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCampusChat, CampusMessage } from '@/hooks/useCampusChat';
import { useAuth } from '@/contexts/AuthContext';
import { CampusUser } from '@/hooks/useCampusUsers';
import ImageModal from '@/components/ui/image-modal';
import { getAvatarProps } from '@/lib/utils/avatar';

interface CampusChatWindowProps {
  otherUser: CampusUser;
  onBack: () => void;
  showBackButton?: boolean;
}

const CampusChatWindow: React.FC<CampusChatWindowProps> = ({
  otherUser,
  onBack,
  showBackButton = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { messages, loading, sending, sendMessage, sendImageMessage } = useCampusChat(otherUser.firebase_uid);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await sendImageMessage(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur-lg">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-secondary/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-10 h-10 ring-2 ring-primary/20 shadow-glow">
            <AvatarImage src={otherUser.avatar_url || undefined} />
            <AvatarFallback {...getAvatarProps(otherUser.display_name)} className="text-lg">
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">
              {otherUser.display_name || 'Unknown User'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {otherUser.status === 'online' ? 'Online' : 
               otherUser.last_seen ? `Last seen ${new Date(otherUser.last_seen).toLocaleString('en-US', {
                 month: 'short',
                 day: 'numeric',
                 hour: '2-digit',
                 minute: '2-digit'
               })}` : 'Last seen recently'}
            </p>
          </div>
        </div>
        
        {/* Menu Button */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6 bg-gradient-subtle">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div 
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Avatar className="w-14 h-14 ring-2 ring-primary-foreground/20 shadow-glow">
                  <AvatarImage src={otherUser.avatar_url || undefined} />
                  <AvatarFallback {...getAvatarProps(otherUser.display_name)} className="text-xl">
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <h4 className="text-2xl font-bold text-foreground mb-3 text-gradient">
                Start conversation with {otherUser.display_name}
              </h4>
              <p className="text-muted-foreground text-lg">
                Send your first message to get the conversation started!
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message: CampusMessage, index) => {
                const isOwn = message.sender_uid === currentUser?.uid;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      damping: 20,
                      stiffness: 200
                    }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01, y: -1 }}
                      className={`max-w-[75%] rounded-2xl p-4 backdrop-blur-sm shadow-md transition-all duration-300 ${
                        isOwn
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-md'
                          : 'bg-background/80 text-foreground rounded-bl-md border border-border/30'
                      } hover:shadow-lg`}
                    >
                      {message.message_type === 'text' ? (
                        <p className="text-sm leading-relaxed">{message.text_content}</p>
                      ) : (
                        <motion.div 
                          className="space-y-2 cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          onClick={() => setSelectedImage(message.image_url || '')}
                        >
                          <img
                            src={message.image_url || ''}
                            alt="Shared image"
                            className="rounded-xl max-w-full h-auto border border-border/20 shadow-md hover:shadow-lg transition-shadow"
                            loading="lazy"
                            style={{ maxHeight: '300px' }}
                          />
                        </motion.div>
                      )}
                      <div className={`flex items-center justify-between mt-2 text-xs ${isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        <span>{formatTime(message.created_at)}</span>
                        {isOwn && (
                          <motion.div 
                            className="flex items-center space-x-1"
                            whileHover={{ scale: 1.05 }}
                          >
                            <CheckCheck className="w-3 h-3 text-green-300" />
                            <span className="text-green-300 text-xs">Sent</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <motion.div 
        className="p-6 border-t border-border/30 bg-background/95 backdrop-blur-xl typing-box-slide-up"
        style={{ 
          paddingBottom: '4rem',
          marginBottom: '2rem'
        }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          damping: 25,
          stiffness: 120,
          duration: 0.6
        }}
      >
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="relative flex-1">
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="relative"
            >
              <Input
                placeholder={`Message ${otherUser.display_name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="pl-12 pr-4 py-3 bg-secondary/30 border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/30 backdrop-blur-sm shadow-message transition-all duration-300 text-base"
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                aria-label="Add attachment"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className={`w-12 h-12 rounded-2xl transition-all duration-300 shadow-elegant ${
                sending 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/50' 
                  : 'bg-gradient-primary hover:shadow-glow'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Send message"
            >
              {sending ? (
                <motion.div className="flex items-center space-x-1">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span className="text-xs text-white font-medium">भेजा जा रहा</span>
                </motion.div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage || ''}
        alt="Shared image"
      />
      
    </div>
  );
};

export default CampusChatWindow;