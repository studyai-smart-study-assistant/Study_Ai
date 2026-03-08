
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Camera, CameraOff, SwitchCamera, X, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LiveTalkingModeProps {
  open: boolean;
  onClose: () => void;
}

interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

const LiveTalkingMode: React.FC<LiveTalkingModeProps> = ({ open, onClose }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef(0);
  const isProcessingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start camera
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Camera access denied');
      setIsCameraOn(false);
    }
  }, []);

  // Capture camera frame as base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn) return null;
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    const targetWidth = 320;
    const aspect = video.videoHeight / video.videoWidth;
    canvas.width = targetWidth;
    canvas.height = Math.max(180, Math.round(targetWidth * aspect));

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.55);
  }, [isCameraOn]);

  const captureFrameWithRetry = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 4; i++) {
      const frame = captureFrame();
      if (frame) return frame;
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return null;
  }, [captureFrame]);

  // STT: transcribe audio blob
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64, language: 'hi' }
      });
      if (error) throw error;
      return data?.transcript || null;
    } catch (err) {
      console.error('STT error:', err);
      return null;
    }
  }, []);

  // Get AI response (multimodal)
  const getAIResponse = useCallback(async (text: string, imageBase64: string | null): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('live-chat', {
        body: {
          prompt: text,
          imageBase64: imageBase64 || undefined,
          history: conversationHistory.slice(-10)
        }
      });
      if (error) throw error;
      return data?.response || null;
    } catch (err) {
      console.error('AI error:', err);
      return null;
    }
  }, [conversationHistory]);

  // TTS: speak text
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!isSpeakerOn || !text.trim()) return;

    // Fast local TTS first (lower latency than network TTS)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
        utterance.rate = 1.02;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
      return;
    }

    // Fallback: server TTS
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language: 'hi-IN', voice: 'priya' }
      });
      if (error) throw error;
      if (data?.audioContent) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioContent}`);
        audioRef.current = audio;
        await audio.play();
        await new Promise<void>(resolve => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  }, [isSpeakerOn]);

  // Full conversation cycle
  const processConversation = useCallback(async (audioBlob: Blob) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Step 1+2: Run STT and camera-frame capture in parallel (lower latency)
      setStatus('thinking');
      setTranscript('...');
      setAiResponse('...');

      const [text, frame] = await Promise.all([
        transcribeAudio(audioBlob),
        captureFrameWithRetry()
      ]);

      if (!text) {
        setStatus('listening');
        isProcessingRef.current = false;
        return;
      }
      setTranscript(text);

      // Step 3: Get Gemini multimodal response
      const response = await getAIResponse(text, frame);
      if (!response) {
        setAiResponse('Sorry, try again.');
        setStatus('listening');
        isProcessingRef.current = false;
        return;
      }
      setAiResponse(response);

      // Update history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: response }
      ]);

      // Step 3: Speak response
      setStatus('speaking');
      await speakText(response);

    } catch (err) {
      console.error('Conversation error:', err);
    } finally {
      isProcessingRef.current = false;
      setStatus('listening');
    }
  }, [transcribeAudio, captureFrameWithRetry, getAIResponse, speakText]);

  // Start continuous listening with silence detection
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Silence detection
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
      const SILENCE_DURATION = 1400;
      let hasSpoken = false;

      const check = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (avg >= SILENCE_THRESHOLD) {
          hasSpoken = true;
          silenceStartRef.current = 0;
        } else if (hasSpoken) {
          if (silenceStartRef.current === 0) silenceStartRef.current = Date.now();
          else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
            // Stop recording, process, then restart
            mediaRecorder.stop();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(check);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        audioCtxRef.current?.close().catch(() => {});
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        analyserRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          await processConversation(audioBlob);
        }
        // Auto restart listening if mic is still on
        if (isMicOn && open) {
          setTimeout(() => startListening(), 150);
        }
      };

      mediaRecorder.start(250);
      setStatus('listening');
      rafRef.current = requestAnimationFrame(check);
    } catch (err) {
      console.error('Mic error:', err);
      toast.error('Microphone access denied');
    }
  }, [isMicOn, open, processConversation]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    analyserRef.current = null;
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    audioCtxRef.current?.close().catch(() => {});
    setStatus('idle');
  }, []);

  // Initialize on open
  useEffect(() => {
    if (open) {
      startCamera(facingMode);
      startListening();
      toast.success('🔴 Live Mode Active!');
    }
    return () => {
      stopListening();
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioRef.current?.pause();
    };
  }, [open]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (isCameraOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      setIsCameraOn(false);
    } else {
      startCamera(facingMode);
      setIsCameraOn(true);
    }
  }, [isCameraOn, facingMode, startCamera]);

  // Switch camera
  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (isCameraOn) startCamera(newFacing);
  }, [facingMode, isCameraOn, startCamera]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    if (isMicOn) {
      stopListening();
      setIsMicOn(false);
    } else {
      setIsMicOn(true);
      startListening();
    }
  }, [isMicOn, stopListening, startListening]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
    if (audioRef.current) audioRef.current.muted = isSpeakerOn;
  }, [isSpeakerOn]);

  // End call
  const handleEndCall = useCallback(() => {
    stopListening();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioRef.current?.pause();
    setConversationHistory([]);
    setTranscript('');
    setAiResponse('');
    setStatus('idle');
    onClose();
  }, [stopListening, onClose]);

  if (!open) return null;

  const statusText = {
    idle: 'Ready',
    listening: '🎙️ Listening...',
    thinking: '🧠 Thinking...',
    speaking: '🔊 Speaking...'
  };

  const statusColor = {
    idle: 'bg-muted',
    listening: 'bg-emerald-500',
    thinking: 'bg-amber-500',
    speaking: 'bg-blue-500'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${!isCameraOn ? 'hidden' : ''}`}
        />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <CameraOff className="h-16 w-16 text-gray-600" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium backdrop-blur-md bg-black/40`}>
            <div className={`h-2.5 w-2.5 rounded-full ${statusColor[status]} ${status === 'listening' ? 'animate-pulse' : ''}`} />
            {statusText[status]}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Live transcript overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {transcript && (
            <div className="mb-2">
              <p className="text-white/60 text-xs mb-0.5">You:</p>
              <p className="text-white text-sm">{transcript}</p>
            </div>
          )}
          {aiResponse && (
            <div>
              <p className="text-emerald-400/80 text-xs mb-0.5">Study AI:</p>
              <p className="text-white text-sm">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-gray-950 px-6 py-5 safe-area-bottom">
        <div className="flex items-center justify-center gap-4 max-w-xs mx-auto">
          {/* Mic */}
          <Button
            onClick={toggleMic}
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
          >
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          {/* Speaker */}
          <Button
            onClick={toggleSpeaker}
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${isSpeakerOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>

          {/* End call */}
          <Button
            onClick={handleEndCall}
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30"
          >
            <Phone className="h-7 w-7 rotate-[135deg]" />
          </Button>

          {/* Camera toggle */}
          <Button
            onClick={toggleCamera}
            variant="ghost"
            size="icon"
            className={`h-14 w-14 rounded-full ${isCameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
          >
            {isCameraOn ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
          </Button>

          {/* Switch camera */}
          <Button
            onClick={switchCamera}
            variant="ghost"
            size="icon"
            disabled={!isCameraOn}
            className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveTalkingMode;
