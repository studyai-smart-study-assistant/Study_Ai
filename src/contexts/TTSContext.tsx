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

const processTextForTTS = (text: string): string => {
  const tableRegex = /\|(.+)\|\n\|(?::?-+:?)+?\|\n((?:\|.*\|\n?)*)/g;
  return text.replace(tableRegex, (table, headerLine, body) => {
    const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
    const rows = body.trim().split('\n').map(rowLine => rowLine.split('|').map(c => c.trim()).filter(Boolean));
    
    if (headers.length === 0) return table;

    let spokenTable = `A table with columns: ${headers.join(', ')}.`;
    rows.forEach((row, rowIndex) => {
      spokenTable += ` Row ${rowIndex + 1}:`;
      row.forEach((cell, cellIndex) => {
        if (headers[cellIndex]) {
          spokenTable += ` ${headers[cellIndex]} is ${cell};`;
        }
      });
    });
    return spokenTable;
  });
};

const chunkText = (text: string, maxLength = 400): string[] => {
    const processedText = processTextForTTS(text);
    if (processedText.length <= maxLength) return [processedText];
    
    const chunks: string[] = [];
    let currentChunk = "";
    const parts = processedText.split(/([.!?।;]+(?:\s|$))/g);
    
    for (const part of parts) {
        if (currentChunk.length + part.length > maxLength) {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = part;
        } else {
            currentChunk += part;
        }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

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
  const audioQueueRef = useRef<Blob[]>([]);
  const currentlyPlayingUrl = useRef<string | null>(null);
  const isFetchingChunksRef = useRef(false);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    audioQueueRef.current = [];
    isFetchingChunksRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();
      if (currentlyPlayingUrl.current) {
        URL.revokeObjectURL(currentlyPlayingUrl.current);
        currentlyPlayingUrl.current = null;
      }
      audioRef.current.src = "";
    }
    
    setState({ isGenerating: false, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
    setCurrentText('');
  }, []);

  const playNextInQueue = useCallback(() => {
    if (currentlyPlayingUrl.current) {
      URL.revokeObjectURL(currentlyPlayingUrl.current);
      currentlyPlayingUrl.current = null;
    }

    const nextBlob = audioQueueRef.current.shift();

    if (nextBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(nextBlob);
      currentlyPlayingUrl.current = audioUrl;
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = speedRef.current;
      audioRef.current.play().catch(e => {
        console.error("Audio play failed:", e);
        stop(); // If play fails, stop everything.
      });
      setState(s => ({ ...s, isPlaying: true, isAudioReady: true, isGenerating: false }));
    } else if (isFetchingChunksRef.current) {
      // Queue is empty, but we are still fetching. Show buffering state.
      setState(s => ({ ...s, isPlaying: false, isGenerating: true }));
    } else {
      // Done fetching and queue is empty.
      stop();
    }
  }, [stop]);
  
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    const handleEnd = () => playNextInQueue();
    audio.addEventListener('ended', handleEnd);
    
    return () => {
      stop();
      audio.removeEventListener('ended', handleEnd);
    };
  }, [playNextInQueue, stop]);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
    if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
    }
    const prefs = getVoicePreferences();
    localStorage.setItem('voicePreferences', JSON.stringify({ ...prefs, speed: newSpeed }));
  }, []);

  const playWithWebSpeechAPI = useCallback((text: string, language: string) => {
    stop();
    const processedText = processTextForTTS(text);
    setCurrentText(processedText.slice(0, 100) + (processedText.length > 100 ? '...' : ''));
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = language;
    utterance.rate = speed;
    utterance.onstart = () => setState({ isGenerating: false, isPlaying: true, isAudioReady: true, isSpeakingNatively: true });
    utterance.onend = stop;
    utterance.onerror = stop;
    window.speechSynthesis.speak(utterance);
  }, [stop, speed]);

  const playWithSarvamAI = useCallback((text: string, language: string) => {
    stop(); // Stop any previous playback
    setCurrentText(text.slice(0, 100) + (text.length > 100 ? '...' : ''));
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState({ isGenerating: true, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
    isFetchingChunksRef.current = true;

    (async () => {
      try {
        const textChunks = chunkText(text);
        const prefs = getVoicePreferences();
        
        for (let i = 0; i < textChunks.length; i++) {
          if (signal.aborted) throw new Error('cancelled');
          const blob = await fetchChunkWithRetry(textChunks[i], language, prefs.voice, signal);
          if (signal.aborted) throw new Error('cancelled');

          const wasQueueEmptyAndPlayerPaused = audioQueueRef.current.length === 0 && (audioRef.current?.paused ?? true);
          audioQueueRef.current.push(blob);

          if (wasQueueEmptyAndPlayerPaused) {
            playNextInQueue();
          }
        }
      } catch (error: any) {
        if (!signal.aborted) {
          console.error('Sarvam TTS failed, falling back to browser:', error.message);
          toast.warning("AI Voice failed. Using browser voice.", { duration: 3000 });
          playWithWebSpeechAPI(text, language);
        }
      } finally {
        if (!signal.aborted) {
          isFetchingChunksRef.current = false;
        }
      }
    })();
  }, [stop, playWithWebSpeechAPI, playNextInQueue]);

  const togglePlayPause = useCallback((text: string, language: string = 'hi-IN') => {
    const { isPlaying, isAudioReady, isSpeakingNatively, isGenerating } = state;
    
    if (isGenerating && !isAudioReady) return;

    if (isPlaying) {
      if (isSpeakingNatively) window.speechSynthesis.pause();
      else if (audioRef.current) audioRef.current.pause();
      setState(s => ({ ...s, isPlaying: false }));
    } else if (isAudioReady) {
      if (isSpeakingNatively) {
        window.speechSynthesis.resume();
      } else if (audioRef.current?.paused) {
         audioRef.current.play().catch(console.error);
         setState(s => ({ ...s, isPlaying: true }));
      }
    } else {
      playWithSarvamAI(text, language);
    }
  }, [state, playWithSarvamAI]);

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
