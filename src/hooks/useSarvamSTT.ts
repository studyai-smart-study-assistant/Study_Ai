import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseSarvamSTTOptions {
  language: string;
  onTranscript?: (text: string) => void;
  silenceThreshold?: number; // ms of silence before auto-stop
}

export function useSarvamSTT({ 
  language, 
  onTranscript,
  silenceThreshold = 3000 // 3 seconds silence = auto stop
}: UseSarvamSTTOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Detect silence using audio levels
  const detectSilence = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    
    // If volume is low (silence), start/continue silence timer
    if (average < 10) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 Silence detected, stopping recording...');
          stopRecording();
        }, silenceThreshold);
      }
    } else {
      // Sound detected, reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    
    // Continue monitoring if still recording
    if (mediaRecorderRef.current?.state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(detectSilence);
    }
  }, [silenceThreshold]);

  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setTranscript('');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;
      
      // Setup audio analysis for silence detection
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
        // Stop silence detection
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        // Process audio
        await processAudio();
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start silence detection
      detectSilence();
      
      toast.success(language === 'hi' ? '🎤 बोलना शुरू करें...' : '🎤 Start speaking...');
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      toast.error(language === 'hi' ? 'माइक्रोफ़ोन एक्सेस नहीं मिला' : 'Microphone access denied');
    }
  }, [language, detectSilence]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  const processAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error(language === 'hi' ? 'कोई ऑडियो रिकॉर्ड नहीं हुआ' : 'No audio recorded');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      console.log(`📤 Sending ${(audioBlob.size / 1024).toFixed(1)}KB audio to Sarvam STT...`);
      
      // Send to Sarvam STT edge function
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
        console.log('✅ Transcript:', data.transcript);
        setTranscript(data.transcript);
        onTranscript?.(data.transcript);
        toast.success(language === 'hi' ? '✅ टेक्स्ट तैयार!' : '✅ Transcription ready!');
      } else {
        toast.warning(language === 'hi' ? 'कोई बोली नहीं मिली' : 'No speech detected');
      }
      
    } catch (error: any) {
      console.error('STT Error:', error);
      toast.error(language === 'hi' ? 'वाक् पहचान विफल' : 'Speech recognition failed');
    } finally {
      setIsProcessing(false);
    }
  }, [language, onTranscript]);

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
