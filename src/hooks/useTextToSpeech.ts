import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getVoicePreferences } from '@/components/profile/VoiceSettings';

/**
 * Represents the state of the Text-to-Speech hook.
 */
interface TTSState {
  isGenerating: boolean; // True when the audio is being fetched/generated.
  isPlaying: boolean;    // True when the audio is actively playing.
  isAudioReady: boolean; // True when the audio is generated and ready to be played.
  isSpeakingNatively: boolean; // True if the browser's Web Speech API is being used.
}

/**
 * Chunks a long string of text into smaller pieces without splitting words.
 * It prioritizes breaking at sentence endings.
 * @param text The input text to chunk.
 * @param maxLength The maximum length of a single chunk.
 * @returns An array of text chunks.
 */
const chunkText = (text: string, maxLength = 500): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  // Split by sentence-ending punctuation, keeping the delimiters
  const parts = text.split(/([.!?।]+(?:\s|$))/g);

  for (const part of parts) {
    if (currentChunk.length + part.length > maxLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If a single chunk is still too long, split it by words
  const finalChunks: string[] = [];
  for(const chunk of chunks){
      if(chunk.length > maxLength){
          let wordChunk = '';
          const words = chunk.split(/\s+/g);
          for(const word of words){
              if(wordChunk.length + word.length + 1 > maxLength){
                  finalChunks.push(wordChunk);
                  wordChunk = word + ' ';
              } else {
                  wordChunk += word + ' ';
              }
          }
          finalChunks.push(wordChunk.trim());
      } else {
          finalChunks.push(chunk);
      }
  }

  return finalChunks.filter(Boolean);
};

/**
 * A custom hook to handle Text-to-Speech functionality.
 * It first tries to use a remote service (Sarvam AI via Supabase) and falls back to the
 * browser's native Web Speech API if the service fails.
 */
export const useTextToSpeech = () => {
  const [ttsState, setTtsState] = useState<TTSState>({
    isGenerating: false,
    isPlaying: false,
    isAudioReady: false,
    isSpeakingNatively: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stops any ongoing TTS activity, either from the remote service or native API.
   */
  const cancel = useCallback(() => {
    // Abort any ongoing network request for audio generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Stop native speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Pause and reset the audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    // Reset the state
    setTtsState({
      isGenerating: false,
      isPlaying: false,
      isAudioReady: false,
      isSpeakingNatively: false,
    });
  }, []);
  
  /**
   * Plays audio using the browser's native Web Speech API.
   * This is used as a fallback.
   * @param text The text to speak.
   * @param language The language code (e.g., 'hi-IN').
   */
  const playWithWebSpeechAPI = (text: string, language: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Your browser does not support Text-to-Speech.");
      setTtsState(prev => ({ ...prev, isGenerating: false }));
      return;
    }

    cancel(); // Cancel any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onstart = () => {
      setTtsState({ isGenerating: false, isPlaying: true, isAudioReady: true, isSpeakingNatively: true });
    };
    utterance.onend = () => {
      setTtsState({ isGenerating: false, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
    };
    utterance.onerror = (event) => {
      console.error("Web Speech API error:", event.error);
      toast.error("An error occurred with the browser's TTS.");
      setTtsState({ isGenerating: false, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Generates and plays audio using the Sarvam AI service.
   * If it fails, it triggers the fallback to the Web Speech API.
   * @param text The text to convert to speech.
   * @param language The language code.
   */
  const playWithSarvamAI = async (text: string, language: string) => {
    cancel();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setTtsState({ isGenerating: true, isPlaying: false, isAudioReady: false, isSpeakingNatively: false });

    try {
      const textChunks = chunkText(text);
      const audioBlobs: Blob[] = [];
      const prefs = getVoicePreferences();

      for (const chunk of textChunks) {
        if (signal.aborted) throw new Error('TTS generation cancelled by user.');
        
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text: chunk, language, voice: prefs.voice },
        });

        if (error || !data.audioContent) {
          throw new Error(`Sarvam AI API failed: ${error?.message || 'No audio content'}`);
        }
        
        const binaryStr = atob(data.audioContent);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        audioBlobs.push(new Blob([bytes.buffer], { type: 'audio/mpeg' }));
      }

      if (signal.aborted) throw new Error('TTS generation cancelled by user.');

      const mergedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(mergedBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = prefs.speed;
        audioRef.current.play();
        setTtsState({ isGenerating: false, isPlaying: true, isAudioReady: true, isSpeakingNatively: false });
      }

    } catch (error: any) {
      console.error("Sarvam AI TTS error:", error);
      if (error.message.includes('cancelled')) {
        toast.info("Audio generation stopped.");
        setTtsState(s => ({...s, isGenerating: false}));
      } else {
        toast.warning("External TTS failed. Switching to browser's voice.", { duration: 3000 });
        playWithWebSpeechAPI(text, language); // << FALLBACK
      }
    }
  };

  /**
   * Toggles between playing and pausing the audio.
   * If audio is not yet generated, it starts the generation process.
   * @param text The text to speak.
   * @param language The language code.
   */
  const togglePlayPause = useCallback((text: string, language: string = 'hi-IN') => {
    const { isPlaying, isAudioReady, isSpeakingNatively } = ttsState;

    if (isPlaying) { // If it's currently playing, pause it.
      if (isSpeakingNatively) {
        window.speechSynthesis.pause();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setTtsState(prev => ({ ...prev, isPlaying: false }));
    } else { // If it's paused or stopped...
      if (isAudioReady) { // ...and audio is ready, resume it.
         if (isSpeakingNatively) {
            window.speechSynthesis.resume();
          } else if (audioRef.current) {
            audioRef.current.play();
          }
         setTtsState(prev => ({ ...prev, isPlaying: true }));
      } else { // ...and audio is not ready, start generation from scratch.
        playWithSarvamAI(text, language);
      }
    }
  }, [ttsState, cancel]);
  
  // Effect to create and manage the <audio> element and clean up resources.
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleAudioEnd = () => {
      setTtsState(prev => ({ ...prev, isPlaying: false }));
    };
    audio.addEventListener('ended', handleAudioEnd);

    // Cleanup function on component unmount
    return () => {
      cancel();
      audio.removeEventListener('ended', handleAudioEnd);
      if (audioRef.current && audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [cancel]);

  return { ...ttsState, togglePlayPause, cancel };
};
