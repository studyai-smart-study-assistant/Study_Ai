
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Sparkles, Mic, MicOff } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { requestMicrophonePermission } from '@/utils/permissions';
import ChatFooterActions, { UploadedFile } from './ChatFooterActions';
import ImagePreview from './ImagePreview';

interface ChatFooterProps {
  onSend: (message: string, files?: UploadedFile[], options?: { reasoningMode?: boolean }) => void;
  isLoading: boolean;
  isDisabled?: boolean;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: (enabled: boolean) => void;
  onDeepThinking: (topic: string) => Promise<void>;
  onNewsSearch: (query: string) => Promise<void>;
}

const ChatFooter: React.FC<ChatFooterProps> = (props) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Tool Modes State
  const [isImageMode, setIsImageMode] = useState(false);
  const [isDeepThinkingMode, setDeepThinkingMode] = useState(false);
  const [isNewsMode, setIsNewsMode] = useState(false);
  const [isReasoningMode, setIsReasoningMode] = useState(false);

  const { language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const clearAllModes = () => {
    props.onWebSearchToggle?.(false);
    setIsImageMode(false);
    setDeepThinkingMode(false);
    setIsNewsMode(false);
  }

  const handleSend = () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    if (isDeepThinkingMode) {
        props.onDeepThinking(input.trim());
    } else if (isNewsMode) {
        props.onNewsSearch(input.trim());
    } else {
        // Regular send (with web search if enabled)
        props.onSend(input.trim(), uploadedFiles);
    }

    setInput('');
    setUploadedFiles([]);
    clearAllModes();
  };

  // ... (rest of the functions like startRecording, etc. remain the same)
    const startRecording = async () => {
    const stream = await requestMicrophonePermission(language);
    if (!stream) return;
    
    audioStreamRef.current = stream;
    setIsListening(true);
    toast.success(language === 'hi' ? '🎙️ बोलिए...' : '🎙️ Listening...');

    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      processAudio();
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    };
    
    mediaRecorder.start();

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, 15000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopRecording();
    else startRecording();
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;
    setIsListening(false);
    setIsTranscribing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size < 1000) {
          toast.warning(language === 'hi' ? 'कुछ सुनाई नहीं दिया।' : 'Did not catch that.');
          return;
      }
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('speech-to-text', { body: { audio: base64Audio, language } });
      if (error) throw new Error('Transcription service failed');
      if (data?.transcript) {
        setInput(prev => prev ? `${prev} ${data.transcript}` : data.transcript);
        toast.success(language === 'hi' ? '✅ टेक्स्ट मिल गया!' : '✅ Transcribed!');
      }
    } catch (err) {
      console.error('Transcription Error:', err);
      toast.error(language === 'hi' ? 'ट्रांसक्रिप्शन में त्रुटि।' : 'Error in transcription.');
    } finally {
      setIsTranscribing(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (props.isDisabled) return language === 'hi' ? "AI जवाब दे रहा है..." : "Waiting for AI...";
    if (isImageMode) return language === 'hi' ? "Image का description लिखें..." : "Describe the image...";
    if (isDeepThinkingMode) return language === 'hi' ? "गहन सोच के लिए विषय..." : "Topic for deep thinking...";
    if (isNewsMode) return language === 'hi' ? "नवीनतम समाचार खोजें..." : "Search for latest news...";
    if (props.webSearchEnabled) return language === 'hi' ? "वेब पर खोजें..." : "Search the web...";
    return language === 'hi' ? "कुछ भी पूछें..." : "Ask anything...";
  };

  const hasContent = input.trim() || uploadedFiles.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-3 pb-3 pt-2">
        
        {uploadedFiles.length > 0 && (
            <div className="flex space-x-2 p-2 overflow-x-auto">
                {uploadedFiles.map(file => (
                    <ImagePreview key={(file as any).id || Math.random()} file={file as any} onRemove={() => setUploadedFiles(files => files.filter((f, i) => f !== file))} />
                ))}
            </div>
        )}

        <div className={`bg-card border border-border rounded-2xl shadow-lg transition-all duration-200 ${props.isDisabled ? 'opacity-60' : ''}`}>
          <div className="px-4 pt-3 pb-2 flex items-start">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="resize-none w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[16px] p-0 min-h-[24px]"
              disabled={props.isLoading || props.isDisabled}
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between px-3 pb-2 pt-0">
            <ChatFooterActions 
              {...props}
              isImageMode={isImageMode}
              setIsImageMode={setIsImageMode}
              isDeepThinkingMode={isDeepThinkingMode}
              setIsDeepThinkingMode={setDeepThinkingMode}
              isNewsMode={isNewsMode}
              setIsNewsMode={setIsNewsMode}
              setUploadedFiles={setUploadedFiles}
              textareaRef={textareaRef}
            />

            <div className="flex items-center gap-2">
              <Button onClick={toggleListening} variant="ghost" size="icon" disabled={props.isLoading || props.isDisabled || isTranscribing} className={`h-9 w-9 rounded-full transition-all ${isListening ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'}`}>
                {isTranscribing ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button onClick={handleSend} disabled={!hasContent || props.isLoading || props.isDisabled} size="icon" className="h-9 w-9 rounded-full">
                {props.isLoading ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : isImageMode ? <Sparkles className="h-4 w-4" /> : <SendHorizonal className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatFooter;
