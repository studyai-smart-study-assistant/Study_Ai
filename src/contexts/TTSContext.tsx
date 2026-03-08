import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getVoicePreferences } from '@/components/profile/VoiceSettings';

interface TTSContextType {
  isGenerating: boolean;
  isPlaying: boolean;
  isAudioReady: boolean;
  isSpeakingNatively: boolean;
  currentText: string;
  speed: number;
  setSpeed: (speed: number) => void;
  togglePlayPause: (text: string, language?: string) => void;
  stop: () => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

const chunkText = (text: string, maxLength = 400): string[] => {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  let currentChunk = "";
  // Split on sentence endings
  const parts = text.split(/([.!?।]+(?:\s|$))/g);
  for (const part of parts) {
    if (currentChunk.length + part.length > maxLength) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  // Further split any chunks still over limit
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > maxLength) {
      let wordChunk = '';
      for (const word of chunk.split(/\s+/g)) {
        if (wordChunk.length + word.length + 1 > maxLength) {
          finalChunks.push(wordChunk.trim());
          wordChunk = word + ' ';
        } else {
          wordChunk += word + ' ';
        }
      }
      if (wordChunk.trim()) finalChunks.push(wordChunk.trim());
    } else {
      finalChunks.push(chunk);
    }
  }
  return finalChunks.filter(Boolean);
};

// Retry a single chunk with exponential backoff
async function fetchChunkWithRetry(
  chunk: string, language: string, voice: string, signal: AbortSignal, retries = 2
): Promise<Blob> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    if (signal.aborted) throw new Error('cancelled');
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: chunk, language, voice },
      });
      if (error) throw new Error(error.message || 'TTS API error');
      if (!data?.audioContent) throw new Error('No audio content');
      
      const binaryStr = atob(data.audioContent);
      const bytes = new Uint8Array(binaryStr.length);
      for (let j = 0; j < binaryStr.length; j++) bytes[j] = binaryStr.charCodeAt(j);
      return new Blob([bytes.buffer], { type: 'audio/mpeg' });
    } catch (err: any) {
      lastError = err;
      if (err.message.includes('cancelled')) throw err;
      if (i < retries) {
        console.warn(`TTS chunk retry ${i + 1}: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw lastError || new Error('TTS chunk failed');
}

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    isGenerating: false,
    isPlaying: false,
    isAudioReady: false,
    isSpeakingNatively: false,
  });
  const [currentText, setCurrentText] = useState('');
  const [speed, setSpeedState] = useState(() => getVoicePreferences().speed);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setState({ isGenerating: false, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
    setCurrentText('');
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  }, []);

  const playWithWebSpeechAPI = useCallback((text: string, language: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Browser does not support TTS.");
      setState(s => ({ ...s, isGenerating: false }));
      return;
    }
    stop();
    setCurrentText(text.slice(0, 100) + (text.length > 100 ? '...' : ''));
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = speed;
    utterance.onstart = () => setState({ isGenerating: false, isPlaying: true, isAudioReady: true, isSpeakingNatively: true });
    utterance.onend = () => {
      setState({ isGenerating: false, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
      setCurrentText('');
    };
    utterance.onerror = () => {
      setState({ isGenerating: false, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
      setCurrentText('');
    };
    window.speechSynthesis.speak(utterance);
  }, [stop, speed]);

  const playWithSarvamAI = useCallback(async (text: string, language: string) => {
    stop();
    setCurrentText(text.slice(0, 100) + (text.length > 100 ? '...' : ''));
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    setState({ isGenerating: true, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });

    try {
      const textChunks = chunkText(text);
      const audioBlobs: Blob[] = [];
      const prefs = getVoicePreferences();

      for (const chunk of textChunks) {
        if (signal.aborted) throw new Error('cancelled');
        const blob = await fetchChunkWithRetry(chunk, language, prefs.voice, signal);
        audioBlobs.push(blob);
      }

      if (signal.aborted) throw new Error('cancelled');
      const mergedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(mergedBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = speed;
        audioRef.current.play();
        setState({ isGenerating: false, isPlaying: true, isAudioReady: true, isSpeakingNatively: false });
      }
    } catch (error: any) {
      if (error.message.includes('cancelled')) {
        setState(s => ({ ...s, isGenerating: false }));
        setCurrentText('');
      } else {
        console.error('Sarvam TTS failed, falling back to browser:', error.message);
        toast.warning("AI Voice failed. Using browser voice.", { duration: 3000 });
        playWithWebSpeechAPI(text, language);
      }
    }
  }, [stop, speed, playWithWebSpeechAPI]);

  const togglePlayPause = useCallback((text: string, language: string = 'hi-IN') => {
    const { isPlaying, isAudioReady, isSpeakingNatively } = state;

    if (isPlaying) {
      if (isSpeakingNatively) window.speechSynthesis.pause();
      else if (audioRef.current) audioRef.current.pause();
      setState(s => ({ ...s, isPlaying: false }));
    } else if (isAudioReady) {
      if (isSpeakingNatively) window.speechSynthesis.resume();
      else if (audioRef.current) audioRef.current.play();
      setState(s => ({ ...s, isPlaying: true }));
    } else {
      playWithSarvamAI(text, language);
    }
  }, [state, playWithSarvamAI]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const handleEnd = () => {
      setState(s => ({ ...s, isPlaying: false, isAudioReady: false }));
      setCurrentText('');
    };
    audio.addEventListener('ended', handleEnd);
    return () => {
      stop();
      audio.removeEventListener('ended', handleEnd);
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
    };
  }, [stop]);

  return (
    <TTSContext.Provider value={{ ...state, currentText, speed, setSpeed, togglePlayPause, stop }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error('useTTS must be used within TTSProvider');
  return ctx;
};
