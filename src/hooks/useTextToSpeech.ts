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

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Decode base64 WAV to AudioBuffer
  const decodeBase64Audio = async (base64: string): Promise<AudioBuffer> => {
    const ctx = getAudioContext();
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return await ctx.decodeAudioData(bytes.buffer);
  };

  // Merge multiple AudioBuffers into one
  const mergeAudioBuffers = (buffers: AudioBuffer[]): AudioBuffer => {
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

  const updateProgress = useCallback(() => {
    if (!state.isPlaying || !audioContextRef.current) return;
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    const duration = mergedBufferRef.current?.duration || 1;
    setState(prev => ({
      ...prev,
      currentTime: Math.min(elapsed, duration),
      progress: Math.min((elapsed / duration) * 100, 100),
    }));
    if (elapsed < duration) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [state.isPlaying]);

  const generateAudio = useCallback(async (text: string, language = 'hi-IN') => {
    abortRef.current = false;
    setState(prev => ({ ...prev, isGenerating: true, audioReady: false }));

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language },
      });

      if (error) throw error;
      if (abortRef.current) return;

      if (!data.audioChunks || data.audioChunks.length === 0) {
        throw new Error('No audio generated');
      }

      if (data.failedChunks?.length > 0) {
        toast.warning(`${data.failedChunks.length} audio chunks skipped`);
      }

      // Decode all chunks
      const audioBuffers: AudioBuffer[] = [];
      for (const chunk of data.audioChunks) {
        if (abortRef.current) return;
        const buffer = await decodeBase64Audio(chunk);
        audioBuffers.push(buffer);
      }

      // Merge into single buffer
      const merged = mergeAudioBuffers(audioBuffers);
      mergedBufferRef.current = merged;

      setState(prev => ({
        ...prev,
        isGenerating: false,
        audioReady: true,
        duration: merged.duration,
      }));
    } catch (error: any) {
      console.error('TTS generation error:', error);
      setState(prev => ({ ...prev, isGenerating: false }));
      if (!abortRef.current) {
        toast.error('Audio generation failed. Please try again.');
      }
    }
  }, []);

  const play = useCallback(() => {
    if (!mergedBufferRef.current) return;
    const ctx = getAudioContext();

    // Stop existing
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
    }

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

    // Start progress tracking
    const track = () => {
      const elapsed = ctx.currentTime - startTimeRef.current;
      const dur = mergedBufferRef.current?.duration || 1;
      setState(prev => ({
        ...prev,
        currentTime: Math.min(elapsed, dur),
        progress: Math.min((elapsed / dur) * 100, 100),
      }));
      if (elapsed < dur) {
        animFrameRef.current = requestAnimationFrame(track);
      }
    };
    animFrameRef.current = requestAnimationFrame(track);
  }, []);

  const pause = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
    }
    cancelAnimationFrame(animFrameRef.current);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const cancel = useCallback(() => {
    abortRef.current = true;
    pause();
    mergedBufferRef.current = null;
    setState({
      isGenerating: false,
      isPlaying: false,
      progress: 0,
      duration: 0,
      currentTime: 0,
      audioReady: false,
    });
  }, [pause]);

  return {
    ...state,
    generateAudio,
    play,
    pause,
    togglePlayPause,
    cancel,
  };
};
