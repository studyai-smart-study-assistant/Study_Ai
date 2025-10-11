
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, X } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageUploadButton from './chat/ImageUploadButton';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';

interface ChatFooterProps {
  onSend: (message: string, imageUrl?: string) => void;
  isLoading: boolean;
  isDisabled?: boolean;
}

const ChatFooter: React.FC<ChatFooterProps> = ({ onSend, isLoading, isDisabled = false }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

    // Check if user wants to generate an image (keywords: "image बनाओ", "generate image", "create image", etc.)
    const imageGenerateKeywords = [
      'image बनाओ', 'इमेज बनाओ', 'image generate', 'generate image', 
      'create image', 'create a', 'make image', 'make a', 'इमेज क्रिएट',
      'photo बनाओ', 'picture बनाओ', 'generate a', 'draw'
    ];
    const shouldGenerateImage = imageGenerateKeywords.some(keyword => 
      input.toLowerCase().includes(keyword.toLowerCase())
    );

    if (shouldGenerateImage && input.trim()) {
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

        // Automatically send the generated image to chat
        onSend(input.trim(), data.imageUrl);
        toast.success('Image बन गई और chat में send हो गई!');
        setInput('');
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

  const handleImageGenerated = (imageUrl: string) => {
    setUploadedImage(imageUrl);
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

  return (
    <div className="fixed bottom-2 left-0 right-0 px-4 pb-6 z-10">
      {/* Background blur overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-gray-900/95 dark:via-gray-900/80 dark:to-transparent backdrop-blur-xl" />
      
      <div className="relative max-w-4xl mx-auto">
        {/* Main input container with enhanced animations */}
        <div className={`
          relative transform transition-all duration-500 ease-out
          ${isFocused ? 'scale-[1.02] translate-y-[-4px]' : 'scale-100 translate-y-0'}
          ${isDisabled ? 'opacity-60' : 'opacity-100'}
        `}>
          {/* Animated glow effect */}
          <div className={`
            absolute inset-0 rounded-2xl transition-all duration-700
            ${isFocused 
              ? 'shadow-[0_0_40px_rgba(147,51,234,0.3)] dark:shadow-[0_0_40px_rgba(147,51,234,0.5)]' 
              : 'shadow-[0_0_20px_rgba(147,51,234,0.1)] dark:shadow-[0_0_20px_rgba(147,51,234,0.2)]'
            }
          `} />
          
          {/* Glass morphism container */}
          <div className={`
            relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl 
            border transition-all duration-500
            ${isFocused 
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

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={isDisabled 
                ? (language === 'hi' ? "AI प्रतिक्रिया का इंतज़ार कर रहा है..." : "Waiting for AI to respond...")
                : (language === 'hi' ? "कुछ भी पूछें, 'image बनाओ...' लिखें या image upload करें" : "Ask anything, type 'image बनाओ...' or upload image")}
              className={`
                resize-none min-h-[80px] max-h-[240px] py-6 pr-20 pl-6 rounded-xl 
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
            
            {/* Action buttons */}
            <div className="absolute right-4 bottom-4 flex items-center gap-2">
              <ImageUploadButton 
                onImageSelect={handleImageSelect}
                isDisabled={isLoading || isDisabled || isUploading}
              />
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !uploadedImage) || isLoading || isDisabled}
                size="icon"
                className={`
                  h-12 w-12 rounded-xl transition-all duration-500
                  ${(!input.trim() && !uploadedImage) || isLoading || isDisabled
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed scale-90'
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
                ) : (
                  <SendHorizonal 
                    size={22} 
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
