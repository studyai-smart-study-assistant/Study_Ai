
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, X, Plus, ImagePlus, Upload, Sparkles } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatFooterProps {
  onSend: (message: string, imageUrl?: string, skipAIResponse?: boolean) => void;
  isLoading: boolean;
  isDisabled?: boolean;
}

const ChatFooter: React.FC<ChatFooterProps> = ({ onSend, isLoading, isDisabled = false }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;
    if (isLoading || isDisabled) return;

    // If image mode is enabled, generate image
    if (isImageMode && input.trim()) {
      try {
        setIsUploading(true);
        toast.info('Image बन रही है... कृपया प्रतीक्षा करें');

        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { prompt: input.trim() }
        });

        if (error) {
          console.error('Generate image error:', error);
          throw error;
        }

        if (!data?.imageUrl) {
          throw new Error('Image generation failed');
        }

        // Send the generated image to chat (skip AI text response)
        onSend(input.trim(), data.imageUrl, true);
        toast.success('Image सफलतापूर्वक बन गई!');
        setInput('');
        setIsImageMode(false);
      } catch (error) {
        console.error('Error generating image:', error);
        toast.error('Image बनाने में समस्या हुई');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Normal message send
    onSend(input.trim(), uploadedImage || undefined);
    setInput('');
    setUploadedImage(null);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleImageSelect = async (file: File) => {
    if (!currentUser) {
      toast.error('कृपया पहले लॉगिन करें');
      return;
    }

    try {
      setIsUploading(true);
      setIsMenuOpen(false);
      
      // Upload to chat_media bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUser.uid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_media')
        .getPublicUrl(filePath);

      setUploadedImage(publicUrl);
      toast.success('Image upload हो गई!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Image upload में समस्या हुई');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const enableImageMode = () => {
    setIsImageMode(true);
    setIsMenuOpen(false);
    textareaRef.current?.focus();
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const getPlaceholder = () => {
    if (isDisabled) {
      return language === 'hi' ? "AI प्रतिक्रिया का इंतज़ार कर रहा है..." : "Waiting for AI to respond...";
    }
    if (isImageMode) {
      return language === 'hi' ? "Image का description लिखें..." : "Describe the image you want...";
    }
    return language === 'hi' ? "कुछ भी पूछें..." : "Ask anything...";
  };

  return (
    <div className="fixed bottom-2 left-0 right-0 px-4 pb-6 z-10">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      {/* Background blur overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-gray-900/95 dark:via-gray-900/80 dark:to-transparent backdrop-blur-xl" />
      
      <div className="relative max-w-4xl mx-auto">
        {/* Image mode indicator */}
        {isImageMode && (
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Sparkles className="h-3 w-3" />
              <span>Image Generation Mode</span>
              <button 
                onClick={() => setIsImageMode(false)}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Main input container with enhanced animations */}
        <div className={`
          relative transform transition-all duration-500 ease-out
          ${isFocused ? 'scale-[1.02] translate-y-[-4px]' : 'scale-100 translate-y-0'}
          ${isDisabled ? 'opacity-60' : 'opacity-100'}
        `}>
          {/* Animated glow effect */}
          <div className={`
            absolute inset-0 rounded-2xl transition-all duration-700
            ${isImageMode 
              ? 'shadow-[0_0_40px_rgba(236,72,153,0.4)] dark:shadow-[0_0_40px_rgba(236,72,153,0.6)]'
              : isFocused 
                ? 'shadow-[0_0_40px_rgba(147,51,234,0.3)] dark:shadow-[0_0_40px_rgba(147,51,234,0.5)]' 
                : 'shadow-[0_0_20px_rgba(147,51,234,0.1)] dark:shadow-[0_0_20px_rgba(147,51,234,0.2)]'
            }
          `} />
          
          {/* Glass morphism container */}
          <div className={`
            relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl 
            border transition-all duration-500
            ${isImageMode
              ? 'border-pink-300/60 dark:border-pink-600/60 shadow-2xl'
              : isFocused 
                ? 'border-purple-300/60 dark:border-purple-600/60 shadow-2xl' 
                : 'border-purple-200/40 dark:border-gray-700/40 shadow-lg'
            }
            p-3
          `}>
            {/* Floating particles animation background */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className={`
                absolute top-2 left-4 w-1 h-1 bg-purple-400 rounded-full
                transition-all duration-1000 ${isFocused ? 'animate-pulse opacity-100' : 'opacity-0'}
              `} />
              <div className={`
                absolute top-6 right-8 w-1 h-1 bg-indigo-400 rounded-full
                transition-all duration-1000 delay-200 ${isFocused ? 'animate-pulse opacity-100' : 'opacity-0'}
              `} />
              <div className={`
                absolute bottom-4 left-12 w-1 h-1 bg-violet-400 rounded-full
                transition-all duration-1000 delay-400 ${isFocused ? 'animate-pulse opacity-100' : 'opacity-0'}
              `} />
            </div>

            {uploadedImage && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="h-20 w-20 object-cover rounded-lg border-2 border-purple-200 dark:border-purple-700"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Plus button with popover menu */}
              <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`
                      h-10 w-10 rounded-xl flex-shrink-0 transition-all duration-300
                      ${isMenuOpen 
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rotate-45' 
                        : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-500 dark:text-gray-400'
                      }
                    `}
                    disabled={isLoading || isDisabled}
                  >
                    <Plus className="h-5 w-5 transition-transform duration-300" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  side="top" 
                  align="start" 
                  className="w-48 p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-purple-200/50 dark:border-gray-700/50"
                >
                  <div className="space-y-1">
                    <button
                      onClick={triggerFileUpload}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload Image</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">फोटो अपलोड करें</p>
                      </div>
                    </button>
                    <button
                      onClick={enableImageMode}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Create Image</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI से image बनाएं</p>
                      </div>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={getPlaceholder()}
                className={`
                  resize-none min-h-[50px] max-h-[240px] py-3 px-4 rounded-xl flex-1
                  border-0 bg-transparent text-base font-medium
                  focus:ring-0 focus:outline-none transition-all duration-300
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  placeholder:transition-all placeholder:duration-300
                  ${isFocused ? 'placeholder:text-purple-400 dark:placeholder:text-purple-400' : ''}
                  ${isDisabled ? 'cursor-not-allowed' : ''}
                `}
                disabled={isLoading || isDisabled}
                rows={1}
              />
              
              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedImage) || isLoading || isDisabled}
                size="icon"
                className={`
                  h-10 w-10 rounded-xl flex-shrink-0 transition-all duration-500
                  ${(!input.trim() && !uploadedImage) || isLoading || isDisabled
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed scale-90'
                    : isImageMode
                      ? `bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                         hover:from-purple-600 hover:to-pink-600
                         hover:scale-110 shadow-lg
                         hover:shadow-pink-300 dark:hover:shadow-pink-800
                         active:scale-95 transform`
                      : `bg-gradient-to-r from-purple-600 to-violet-600 text-white 
                         hover:from-purple-700 hover:to-violet-700 
                         dark:from-purple-700 dark:to-violet-700 
                         dark:hover:from-purple-600 dark:hover:to-violet-600
                         hover:scale-110 hover:rotate-12 shadow-lg
                         hover:shadow-purple-300 dark:hover:shadow-purple-800
                         active:scale-95 transform`
                  }
                `}
              >
                {isLoading || isUploading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
                ) : isImageMode ? (
                  <Sparkles 
                    size={18} 
                    className="transition-transform duration-300"
                  />
                ) : (
                  <SendHorizonal 
                    size={18} 
                    className={`transition-transform duration-300 ${
                      (input.trim() || uploadedImage) && !isDisabled ? 'group-hover:translate-x-1' : ''
                    }`} 
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced footer text with animations */}
        {!isMobile && (
          <div className={`
            max-w-4xl mx-auto mt-4 text-xs text-center transition-all duration-700
            ${isFocused 
              ? 'text-purple-600/90 dark:text-purple-400/90 transform translate-y-[-2px]' 
              : 'text-purple-500/70 dark:text-purple-400/70'
            }
            flex items-center justify-center gap-3
          `}>
            <span className={`
              text-yellow-500 transition-all duration-500
              ${isFocused ? 'animate-pulse scale-110' : 'animate-pulse'}
            `}>✨</span>
            <span className="font-medium">
              {language === 'hi' ? "स्टडी AI - स्मार्ट लर्निंग सहायक" : "Study AI - Smart learning assistant"}
            </span>
            <span className={`
              text-yellow-500 transition-all duration-500 delay-100
              ${isFocused ? 'animate-pulse scale-110' : 'animate-pulse'}
            `}>✨</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatFooter;
