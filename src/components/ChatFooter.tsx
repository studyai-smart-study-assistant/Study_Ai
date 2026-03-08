
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, X, Plus, Upload, Sparkles, Globe, SlidersHorizontal, Camera, ImageIcon, Download } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { saveImageToGallery, downloadImage } from '@/lib/imageGalleryDB';
import ImageGallery from '@/components/ImageGallery';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatFooterProps {
  onSend: (message: string, imageUrl?: string, skipAIResponse?: boolean) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: (enabled: boolean) => void;
}

const ChatFooter: React.FC<ChatFooterProps> = ({ onSend, isLoading, isDisabled = false, webSearchEnabled = false, onWebSearchToggle }) => {
  const [input, setInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;
    if (isLoading || isDisabled) return;

    if (isImageMode && input.trim()) {
      try {
        setIsUploading(true);
        toast.info(language === 'hi' ? 'Image बन रही है... कृपया प्रतीक्षा करें' : 'Generating image... please wait');
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { prompt: input.trim() }
        });
        if (error) throw error;
        if (!data?.imageUrl) throw new Error('Image generation failed');
        
        // Save to IndexedDB gallery
        await saveImageToGallery({
          id: crypto.randomUUID(),
          prompt: input.trim(),
          imageData: data.imageUrl,
          createdAt: Date.now(),
        });
        
        onSend(input.trim(), data.imageUrl, true);
        toast.success(language === 'hi' ? 'Image सफलतापूर्वक बन गई!' : 'Image generated successfully!');
        setInput('');
        setIsImageMode(false);
      } catch (error: any) {
        console.error('Error generating image:', error);
        const msg = error?.message || '';
        if (msg.includes('Rate limit')) {
          toast.error(language === 'hi' ? 'बहुत ज़्यादा requests — थोड़ी देर बाद try करें' : 'Rate limited — try again later');
        } else if (msg.includes('Payment')) {
          toast.error(language === 'hi' ? 'Credits खत्म हो गए' : 'Credits exhausted');
        } else {
          toast.error(language === 'hi' ? 'Image बनाने में समस्या हुई' : 'Image generation failed');
        }
      } finally {
        setIsUploading(false);
      }
      return;
    }

    onSend(input.trim(), uploadedImage || undefined);
    setInput('');
    setUploadedImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleImageSelect = async (file: File) => {
    try {
      setIsUploading(true);
      setIsAttachOpen(false);
      
      // Convert to base64 locally - no Supabase upload needed
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUploadedImage(base64);
        setIsUploading(false);
        toast.success(language === 'hi' ? 'Image ready!' : 'Image ready!');
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast.error(language === 'hi' ? 'Image पढ़ने में समस्या' : 'Failed to read image');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading image:', error);
      toast.error(language === 'hi' ? 'Image में समस्या हुई' : 'Image error');
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (isDisabled) return language === 'hi' ? "AI जवाब दे रहा है..." : "Waiting for AI...";
    if (isImageMode) return language === 'hi' ? "Image का description लिखें..." : "Describe the image...";
    return language === 'hi' ? "कुछ भी पूछें..." : "Ask anything...";
  };

  const hasContent = input.trim() || uploadedImage;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraInputChange} />

      {/* Fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-3 pb-3 pt-2">
        {/* Image mode badge */}
        {isImageMode && (
          <div className="mb-2 flex justify-center">
            <div className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-primary/20">
              <Sparkles className="h-3 w-3" />
              <span>Image Generation</span>
              <button onClick={() => setIsImageMode(false)} className="ml-1 hover:bg-primary/10 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Web search active badge */}
        {webSearchEnabled && (
          <div className="mb-2 flex justify-center">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
              <Globe className="h-3 w-3" />
              <span>Web Search ON</span>
              <button onClick={() => onWebSearchToggle?.(false)} className="ml-1 hover:bg-emerald-500/10 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Main container - Gemini style */}
        <div className={`
          bg-card border border-border rounded-2xl shadow-lg
          transition-all duration-200
          ${isDisabled ? 'opacity-60' : ''}
        `}>
          {/* Uploaded image preview */}
          {uploadedImage && (
            <div className="px-4 pt-3">
              <div className="relative inline-block">
                <img src={uploadedImage} alt="Uploaded" className="h-16 w-auto object-cover rounded-lg border border-border" />
                <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="px-4 pt-3 pb-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="resize-none min-h-[44px] max-h-[200px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-foreground placeholder:text-muted-foreground/60 p-0"
              disabled={isLoading || isDisabled}
              rows={1}
            />
          </div>

          {/* Bottom toolbar - Gemini style */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-1">
              {/* + Attach button */}
              <Popover open={isAttachOpen} onOpenChange={setIsAttachOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${isAttachOpen ? 'rotate-45 text-foreground' : ''}`}
                    disabled={isLoading || isDisabled}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-44 p-1.5">
                  <button
                    onClick={() => { fileInputRef.current?.click(); setIsAttachOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Upload Image</span>
                  </button>
                  <button
                    onClick={() => { cameraInputRef.current?.click(); setIsAttachOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Camera</span>
                  </button>
                </PopoverContent>
              </Popover>

              {/* Tools button (web search, image create) */}
              <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${isToolsOpen ? 'text-foreground bg-muted' : ''}`}
                    disabled={isLoading || isDisabled}
                  >
                    <SlidersHorizontal className="h-[18px] w-[18px]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-52 p-1.5">
                  {onWebSearchToggle && (
                    <button
                      onClick={() => { onWebSearchToggle(!webSearchEnabled); setIsToolsOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${webSearchEnabled ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-muted'}`}>
                        <Globe className={`h-4 w-4 ${webSearchEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">Web Search</p>
                        <p className="text-[11px] text-muted-foreground">{webSearchEnabled ? 'ON — टैप करें बंद करने को' : 'रियल-टाइम वेब सर्च'}</p>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => { setIsImageMode(!isImageMode); setIsToolsOpen(false); textareaRef.current?.focus(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isImageMode ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Sparkles className={`h-4 w-4 ${isImageMode ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">Image Create</p>
                      <p className="text-[11px] text-muted-foreground">{isImageMode ? 'ON — AI image mode' : 'AI से image बनाएं'}</p>
                    </div>
                   </button>
                  <button
                    onClick={() => { setIsGalleryOpen(true); setIsToolsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">Image Gallery</p>
                      <p className="text-[11px] text-muted-foreground">{language === 'hi' ? 'बनाई गई images देखें' : 'View generated images'}</p>
                    </div>
                  </button>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              {/* Fast badge */}
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-full select-none">
                Fast
              </div>

              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={!hasContent || isLoading || isDisabled}
                size="icon"
                className={`
                  h-9 w-9 rounded-full transition-all duration-200
                  ${hasContent && !isLoading && !isDisabled
                    ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                {isLoading || isUploading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : isImageMode ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ImageGallery open={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
    </div>
  );
};

export default ChatFooter;
