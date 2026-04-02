import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseSarvamSTTOptions {
  language: string;
  onTranscript?: (text: string) => void;
  onAutoSend?: (text: string) => void;
  silenceThreshold?: number; // ms of silence before auto-stop
}

export function useSarvamSTT({ 
  language, 
  onTranscript,
  onAutoSend,
  silenceThreshold = 25000 // 25 seconds silence = auto stop
}: UseSarvamSTTOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stopRecordingRef = useRef<() => void>(() => {});
  const hasSpeechStartedRef = useRef(false);
  const retryCountRef = useRef(0);

  // Detect silence using audio levels
  const detectSilence = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    
    if (average < 10) {
      if (hasSpeechStartedRef.current && !silenceTimerRef.current) {
        console.log('🔇 Silence detected, starting timer...');
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 Silence threshold reached, auto-stopping...');
          stopRecordingRef.current();
        }, silenceThreshold);
      }
    } else {
      hasSpeechStartedRef.current = true;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    
    if (mediaRecorderRef.current?.state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(detectSilence);
    }
  }, [silenceThreshold]);

  const processAudioWithRetry = useCallback(async (audioBlob: Blob, attempt = 0): Promise<string | null> => {
    const maxRetries = 2;
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      console.log(`📤 STT attempt ${attempt + 1}: Sending ${(audioBlob.size / 1024).toFixed(1)}KB audio...`);
      
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { 
          audio: base64Audio, 
          language: language === 'hi' ? 'hi' : 'en' 
        }
      });
      
      if (error) {
        throw new Error(error.message || 'STT API error');
      }
      
      if (data?.transcript) {
        return data.transcript;
      }
      
      // No transcript but no error - likely no speech detected
      return '';
      
    } catch (err: any) {
      console.error(`STT attempt ${attempt + 1} failed:`, err.message);
      
      // Retry on network/server errors
      if (attempt < maxRetries && (err.message.includes('503') || err.message.includes('timeout') || err.message.includes('network'))) {
        console.log(`🔄 Retrying STT (${attempt + 2}/${maxRetries + 1})...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return processAudioWithRetry(audioBlob, attempt + 1);
      }
      
      throw err;
    }
  }, [language]);

  const processAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error(language === 'hi' ? 'कोई ऑडियो रिकॉर्ड नहीं हुआ' : 'No audio recorded');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Minimum audio size check
      if (audioBlob.size < 1000) {
        toast.warning(language === 'hi' ? 'ऑडियो बहुत छोटा है' : 'Audio too short');
        return;
      }
      
      const result = await processAudioWithRetry(audioBlob);
      
      if (result && result.trim()) {
        console.log('✅ Transcript:', result);
        setTranscript(result);
        onTranscript?.(result);
        onAutoSend?.(result);
        retryCountRef.current = 0;
      } else {
        toast.warning(language === 'hi' ? 'कोई बोली नहीं मिली, फिर से बोलें' : 'No speech detected, try again');
      }
      
    } catch (error: any) {
      console.error('STT Error:', error);
      
      // Show appropriate error message
      if (error.message.includes('503') || error.message.includes('exhausted')) {
        toast.error(language === 'hi' ? 'सर्वर व्यस्त है, कुछ देर बाद प्रयास करें' : 'Server busy, try again later');
      } else {
        toast.error(language === 'hi' ? 'वाक् पहचान विफल' : 'Speech recognition failed');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [language, onTranscript, onAutoSend, processAudioWithRetry]);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      hasSpeechStartedRef.current = false;
      setTranscript('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;
      
      // Setup audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        await processAudio();
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      detectSilence();
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error(language === 'hi' ? 'माइक्रोफ़ोन की अनुमति दें' : 'Please allow microphone access');
      } else {
        toast.error(language === 'hi' ? 'माइक्रोफ़ोन एक्सेस नहीं मिला' : 'Microphone access failed');
      }
    }
  }, [language, detectSilence, processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  stopRecordingRef.current = stopRecording;

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    transcript,
    startRecording,
    stopRecording,
    toggleRecording
  };
}
