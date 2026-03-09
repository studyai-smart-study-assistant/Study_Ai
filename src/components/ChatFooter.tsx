
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, X, Plus, Upload, Sparkles, Globe, SlidersHorizontal, Camera, ImageIcon, Download, Mic, MicOff, Radio, Telescope } from "lucide-react";
import LiveTalkingMode from '@/components/chat/LiveTalkingMode';
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
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const autoSendRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  // Mic permission is now requested only when user clicks the mic button
  // This avoids side effects on other apps that use microphone

  const detectSilence = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioCtxRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    analyserRef.current = analyser;
    silenceStartRef.current = 0;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const SILENCE_THRESHOLD = 15;
    const SILENCE_DURATION = 25000; // 25s silence = auto stop

    const check = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg < SILENCE_THRESHOLD) {
        if (silenceStartRef.current === 0) silenceStartRef.current = Date.now();
        else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
          autoSendRef.current = true;
          stopRecording();
          return;
        }
      } else {
        silenceStartRef.current = 0;
      }
      rafRef.current = requestAnimationFrame(check);
    };
    rafRef.current = requestAnimationFrame(check);
  };

  const stopRecording = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    analyserRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      autoSendRef.current = false;

      detectSilence(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        audioCtxRef.current?.close().catch(() => {});
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 1000) {
          toast.error(language === 'hi' ? 'कोई आवाज़ नहीं मिली' : 'No audio detected');
          return;
        }

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          const { data, error } = await supabase.functions.invoke('speech-to-text', {
            body: { audio: base64, language: language === 'hi' ? 'hi' : 'en' },
          });

          if (error) throw error;
          if (data?.transcript) {
            const transcript = data.transcript;
            if (autoSendRef.current) {
              onSend(transcript);
              toast.success(language === 'hi' ? '🎙️ भेज दिया!' : '🎙️ Sent!');
            } else {
              setInput(prev => prev ? `${prev} ${transcript}` : transcript);
              toast.success(language === 'hi' ? '✅ टेक्स्ट मिल गया!' : '✅ Transcribed!');
            }
          } else {
            toast.error(language === 'hi' ? 'कुछ समझ नहीं आया, फिर बोलें' : 'Could not understand, try again');
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          toast.error(language === 'hi' ? 'ट्रांसक्रिप्शन विफल' : 'Transcription failed');
        } finally {
          setIsTranscribing(false);
          autoSendRef.current = false;
        }
      };

      mediaRecorder.start(250);
      setIsListening(true);
      toast.success(language === 'hi' ? '🎙️ बोलिए... चुप होने पर auto-send होगा' : '🎙️ Speak... auto-sends on silence');
    } catch (err) {
      console.error('Mic access error:', err);
      toast.error(language === 'hi' ? 'माइक्रोफ़ोन की अनुमति दें' : 'Please allow microphone access');
    }
  };

  const toggleListening = () => {
    if (isListening) stopRecording();
    else startRecording();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;
    if (isLoading || isDisabled) return;

    if (isDeepThinking && input.trim()) {
      handleDeepThinkingSend(input.trim());
      setInput('');
      setIsDeepThinking(false);
      return;
    }

    if (isImageMode && input.trim()) {
      try {
        setIsUploading(true);
        const hasUploadedImage = !!uploadedImage;
        toast.info(language === 'hi' 
          ? (hasUploadedImage ? 'Image edit हो रही है... कृपया प्रतीक्षा करें' : 'Image बन रही है... कृपया प्रतीक्षा करें')
          : (hasUploadedImage ? 'Editing image... please wait' : 'Generating image... please wait')
        );
        
        // Pass uploaded image for editing, or just prompt for generation
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { 
            prompt: input.trim(),
            imageBase64: uploadedImage || undefined
          }
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
        toast.success(language === 'hi' 
          ? (hasUploadedImage ? 'Image edit हो गई!' : 'Image सफलतापूर्वक बन गई!')
          : (hasUploadedImage ? 'Image edited successfully!' : 'Image generated successfully!')
        );
        setInput('');
        setUploadedImage(null);
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
    if (isListening) { stopRecording(); }
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
    if (isDeepThinking) return language === 'hi' ? "कोई भी टॉपिक लिखें — गहन रिसर्च होगी..." : "Enter topic for deep research...";
    return language === 'hi' ? "कुछ भी पूछें..." : "Ask anything...";
  };

  const handleDeepThinkingSend = (text: string) => {
    const deepPrompt = `🔬 [DEEP RESEARCH] ${text} — इस विषय पर गहन इंटरनेट रिसर्च करो और एडवांस लेवल की जानकारी दो। सभी पहलुओं को कवर करो — इतिहास, वर्तमान स्थिति, भविष्य की संभावनाएं, और expert opinions। हिंदी और English दोनों में समझाओ।`;
    onSend(deepPrompt);
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
                  {/* Deep Thinking button */}
                  <button
                    onClick={() => { setIsDeepThinking(!isDeepThinking); setIsImageMode(false); setIsToolsOpen(false); textareaRef.current?.focus(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isDeepThinking ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-muted'}`}>
                      <Telescope className={`h-4 w-4 ${isDeepThinking ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">Deep Thinking</p>
                      <p className="text-[11px] text-muted-foreground">{isDeepThinking ? 'ON — गहन रिसर्च mode' : 'Advanced research करें'}</p>
                    </div>
                  </button>
                  {/* Live Talking button */}
                  <button
                    onClick={() => { setIsLiveMode(true); setIsToolsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-destructive/10">
                      <Radio className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">Live Talking</p>
                      <p className="text-[11px] text-muted-foreground">Gemini Live जैसा अनुभव</p>
                    </div>
                  </button>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              {/* Mic button - primary position */}
              <Button
                onClick={toggleListening}
                variant="ghost"
                size="icon"
                disabled={isLoading || isDisabled || isTranscribing}
                className={`h-10 w-10 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 animate-pulse ring-2 ring-destructive/30' 
                    : isTranscribing
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={language === 'hi' ? (isListening ? 'बंद करें' : isTranscribing ? 'ट्रांसक्राइब हो रहा...' : 'बोलकर टाइप करें') : (isListening ? 'Stop' : isTranscribing ? 'Transcribing...' : 'Voice input')}
              >
                {isTranscribing ? (
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

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
      <LiveTalkingMode open={isLiveMode} onClose={() => setIsLiveMode(false)} />
    </div>
  );
};

export default ChatFooter;
