
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Image as ImageIcon, X, Sparkles, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((message.trim() || file) && !isLoading) {
      onSendMessage(message.trim(), file ? file : undefined);
      setMessage('');
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size - 5MB limit
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      
      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Only image files are allowed.");
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background glow */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-pink-500/20 rounded-2xl blur-xl"
        animate={isFocused ? { opacity: 1, scale: 1.02 } : { opacity: 0.5, scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      <form onSubmit={handleSubmit} className="p-4 border-t-0 flex flex-col gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-700/50 shadow-xl relative">
        <AnimatePresence>
          {previewUrl && (
            <motion.div 
              className="relative inline-block max-w-[150px] mr-2"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="h-20 w-auto object-cover rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-lg" 
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-lg"
                  onClick={clearSelectedFile}
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask anything"
              className="min-h-[50px] max-h-[120px] resize-none border-0 bg-transparent focus:ring-2 focus:ring-purple-500/50 rounded-xl text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              disabled={isLoading}
            />
            
            {/* Character count indicator */}
            {message.length > 0 && (
              <motion.div 
                className="absolute bottom-2 right-2 text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {message.length}
              </motion.div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{display:'none'}}
            onChange={onFileChange}
          />
          
          {/* Action buttons with enhanced styling */}
          <div className="flex gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-800/50 dark:hover:to-indigo-800/50 border border-purple-200/50 dark:border-purple-700/50 transition-all duration-300"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="छवि संलग्न करें"
              >
                <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-100 to-pink-100 dark:from-indigo-900/30 dark:to-pink-900/30 hover:from-indigo-200 hover:to-pink-200 dark:hover:from-indigo-800/50 dark:hover:to-pink-800/50 border border-indigo-200/50 dark:border-indigo-700/50 transition-all duration-300"
                disabled={isLoading}
                title="वॉयस मैसेज"
              >
                <Mic className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isLoading ? { rotate: 360 } : {}}
              transition={isLoading ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
            >
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg transition-all duration-300 relative overflow-hidden group"
                disabled={(!message.trim() && !file) || isLoading}
              >
                <div className="absolute inset-0 bg-white/20 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </div>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* AI suggestion pills */}
        {!message.trim() && !isLoading && (
          <motion.div 
            className="flex gap-2 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {['मुझे समझाइए', 'क्विज़ बनाइए', 'नोट्स दीजिए'].map((suggestion, index) => (
              <motion.button
                key={suggestion}
                className="px-3 py-1 text-xs bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200/50 dark:border-purple-700/50 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-800/30 dark:hover:to-indigo-800/30 transition-all duration-300"
                onClick={() => setMessage(suggestion)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

export default ChatInput;
