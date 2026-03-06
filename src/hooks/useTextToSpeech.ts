import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TTSState {
  isGenerating: boolean;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  audioReady: boolean;
}

const MAX_CHUNK_CHARS = 400;

/** Clean markdown for TTS */
function cleanForTTS(text: string): string {
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/`([^`]+)`/g, '$1');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  t = t.replace(/\n+/g, ' ');
  return t.trim();
}

/** Split text into chunks at sentence boundaries, never breaking words */
function smartChunk(text: string, maxLen: number): string[] {
  // Split on sentence endings
  const sentences = text.split(/(?<=[.?!।])\s+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      // sentence itself is too long, split at word boundaries
      if (current.trim()) { chunks.push(current.trim()); current = ''; }
      const words = sentence.split(/\s+/);
      let wordChunk = '';
      for (const word of words) {
        if ((wordChunk + ' ' + word).trim().length > maxLen) {
          if (wordChunk.trim()) chunks.push(wordChunk.trim());
          wordChunk = word;
        } else {
          wordChunk = wordChunk ? wordChunk + ' ' + word : word;
        }
      }
      if (wordChunk.trim()) { current = wordChunk.trim(); }
    } else if ((current + ' ' + sentence).trim().length > maxLen) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Web Speech API fallback */
function speakWithWebTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      return reject(new Error('Web TTS not supported'));
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);
    window.speechSynthesis.speak(utterance);
  });
}

export const useTextToSpeech = () => {
  const [state, setState] = useState<TTSState>({
    isGenerating: false,
    isPlaying: false,
    progress: 0,
    duration: 0,
    currentTime: 0,
    audioReady: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mergedBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const abortRef = useRef(false);
  const webTTSFallbackRef = useRef(false);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const decodeBase64Audio = async (base64: string): Promise<AudioBuffer> => {
    const ctx = getAudioContext();
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return await ctx.decodeAudioData(bytes.buffer);
  };

  const mergeAudioBuffers = (buffers: AudioBuffer[]): AudioBuffer => {
    if (buffers.length === 0) throw new Error("No audio buffers to merge");
    const ctx = getAudioContext();
    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const sampleRate = buffers[0].sampleRate;
    const channels = buffers[0].numberOfChannels;
    const merged = ctx.createBuffer(channels, totalLength, sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      const output = merged.getChannelData(ch);
      let offset = 0;
      for (const buf of buffers) {
        output.set(buf.getChannelData(ch), offset);
        offset += buf.length;
      }
    }
    return merged;
  };

  const generateAudio = useCallback(async (text: string, language = 'hi-IN') => {
    abortRef.current = false;
    webTTSFallbackRef.current = false;
    setState({ isGenerating: true, isPlaying: false, progress: 0, duration: 0, currentTime: 0, audioReady: false });
    mergedBufferRef.current = null;

    const cleanText = cleanForTTS(text);
    if (!cleanText) {
      setState(prev => ({ ...prev, isGenerating: false }));
      return;
    }

    const chunks = smartChunk(cleanText, MAX_CHUNK_CHARS);
    console.log(`TTS: ${chunks.length} chunks from ${cleanText.length} chars`);

    const allBuffers: AudioBuffer[] = [];
    let sarvamFailed = false;

    for (let i = 0; i < chunks.length; i++) {
      if (abortRef.current) return;
      setState(prev => ({ ...prev, progress: (i / chunks.length) * 90 }));

      try {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text: chunks[i], language },
        });

        if (error) {
          console.warn(`TTS chunk ${i} failed:`, error);
          sarvamFailed = true;
          break;
        }

        if (data?.audioChunks?.length > 0) {
          for (const audioBase64 of data.audioChunks) {
            if (abortRef.current) return;
            try {
              const buffer = await decodeBase64Audio(audioBase64);
              allBuffers.push(buffer);
            } catch (decodeErr) {
              console.error('Decode error:', decodeErr);
            }
          }
        }
      } catch (e) {
        console.error(`Chunk ${i} error:`, e);
        sarvamFailed = true;
        break;
      }
    }

    // If Sarvam AI failed completely, fallback to Web TTS
    if (allBuffers.length === 0 || sarvamFailed) {
      if (allBuffers.length === 0) {
        console.log('Sarvam AI failed, falling back to Web Speech TTS');
        webTTSFallbackRef.current = true;
        try {
          setState(prev => ({ ...prev, progress: 50 }));
          await speakWithWebTTS(cleanText);
          setState({ isGenerating: false, isPlaying: false, progress: 100, duration: 0, currentTime: 0, audioReady: false });
          toast.info('ब्राउज़र TTS का उपयोग किया गया');
          return;
        } catch (webErr) {
          console.error('Web TTS also failed:', webErr);
          setState(prev => ({ ...prev, isGenerating: false }));
          toast.error('ऑडियो जनरेट नहीं हो सका');
          return;
        }
      }
    }

    try {
      const merged = mergeAudioBuffers(allBuffers);
      mergedBufferRef.current = merged;
      setState(prev => ({ ...prev, isGenerating: false, audioReady: true, duration: merged.duration, progress: 100 }));
    } catch (mergeErr) {
      console.error('Merge error:', mergeErr);
      setState(prev => ({ ...prev, isGenerating: false }));
      toast.error('ऑडियो merge नहीं हो सका');
    }
  }, []);

  const play = useCallback(() => {
    if (!mergedBufferRef.current) return;
    const ctx = getAudioContext();
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} }

    const source = ctx.createBufferSource();
    source.buffer = mergedBufferRef.current;
    source.connect(ctx.destination);
    source.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false, progress: 100, currentTime: prev.duration }));
      cancelAnimationFrame(animFrameRef.current);
    };

    startTimeRef.current = ctx.currentTime;
    source.start(0);
    sourceRef.current = source;
    setState(prev => ({ ...prev, isPlaying: true }));

    const track = () => {
      if (!sourceRef.current || !mergedBufferRef.current) return;
      const elapsed = ctx.currentTime - startTimeRef.current;
      const dur = mergedBufferRef.current.duration;
      if (elapsed >= dur) {
        setState(prev => ({ ...prev, currentTime: dur, progress: 100, isPlaying: false }));
        cancelAnimationFrame(animFrameRef.current);
        return;
      }
      setState(prev => ({ ...prev, currentTime: elapsed, progress: (elapsed / dur) * 100 }));
      animFrameRef.current = requestAnimationFrame(track);
    };
    animFrameRef.current = requestAnimationFrame(track);
  }, []);

  const pause = useCallback(() => {
    if (webTTSFallbackRef.current) {
      window.speechSynthesis?.cancel();
    }
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} }
    cancelAnimationFrame(animFrameRef.current);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) pause(); else play();
  }, [state.isPlaying, play, pause]);

  const cancel = useCallback(() => {
    abortRef.current = true;
    pause();
    mergedBufferRef.current = null;
    setState({ isGenerating: false, isPlaying: false, progress: 0, duration: 0, currentTime: 0, audioReady: false });
  }, [pause]);

  return { ...state, generateAudio, play, pause, togglePlayPause, cancel };
};
