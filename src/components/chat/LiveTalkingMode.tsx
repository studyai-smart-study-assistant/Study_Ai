
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Camera, CameraOff, SwitchCamera, X, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LiveAudioWave from './LiveAudioWave';

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [activeAnalyser, setActiveAnalyser] = useState<AnalyserNode | null>(null);

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
  const isSpeakingRef = useRef(false);
  const shouldListenRef = useRef(true);

  // ── Camera ──
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Camera access denied');
      setIsCameraOn(false);
    }
  }, []);

  // ── Frame capture ──
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn) return null;
    const v = videoRef.current;
    if (v.readyState < 2 || v.videoWidth === 0) return null;
    const c = canvasRef.current;
    const tw = 320;
    c.width = tw;
    c.height = Math.max(180, Math.round(tw * (v.videoHeight / v.videoWidth)));
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.55);
  }, [isCameraOn]);

  const captureFrameWithRetry = useCallback(async (): Promise<string | null> => {
    for (let i = 0; i < 4; i++) {
      const f = captureFrame();
      if (f) return f;
      await new Promise(r => setTimeout(r, 120));
    }
    return null;
  }, [captureFrame]);

  // ── STT ──
  const transcribeAudio = useCallback(async (blob: Blob): Promise<string | null> => {
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((res, rej) => {
        reader.onloadend = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke('speech-to-text', { body: { audio: b64, language: 'hi' } });
      if (error) throw error;
      return data?.transcript || null;
    } catch (e) {
      console.error('STT error:', e);
      return null;
    }
  }, []);

  // ── AI ──
  const getAIResponse = useCallback(async (text: string, img: string | null): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('live-chat', {
        body: { prompt: text, imageBase64: img || undefined, history: conversationHistory.slice(-10) }
      });
      if (error) throw error;
      return data?.response || null;
    } catch (e) {
      console.error('AI error:', e);
      return null;
    }
  }, [conversationHistory]);

  // ── TTS with interruption ──
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!isSpeakerOn || !text.trim()) return;
    isSpeakingRef.current = true;

    if ('speechSynthesis' in window) {
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
        u.rate = 1.05;
        u.onend = () => { isSpeakingRef.current = false; resolve(); };
        u.onerror = () => { isSpeakingRef.current = false; resolve(); };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language: 'hi-IN', voice: 'priya' }
      });
      if (error) throw error;
      if (data?.audioContent) {
        const a = new Audio(`data:audio/wav;base64,${data.audioContent}`);
        await a.play();
        await new Promise<void>(r => { a.onended = () => r(); a.onerror = () => r(); });
      }
    } catch { /* fallback silent */ }
    isSpeakingRef.current = false;
  }, [isSpeakerOn]);

  // ── Interruption: stop AI speech when user talks ──
  const interruptSpeech = useCallback(() => {
    if (isSpeakingRef.current) {
      window.speechSynthesis?.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  // ── Full conversation cycle ──
  const processConversation = useCallback(async (audioBlob: Blob) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    interruptSpeech(); // stop any ongoing AI speech

    try {
      setStatus('thinking');
      setTranscript('');
      setAiResponse('');

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

      const response = await getAIResponse(text, frame);
      if (!response) {
        setAiResponse('Sorry, try again.');
        setStatus('listening');
        isProcessingRef.current = false;
        return;
      }
      setAiResponse(response);
      setConversationHistory(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: response }]);

      setStatus('speaking');
      await speakText(response);
    } catch (err) {
      console.error('Conversation error:', err);
    } finally {
      isProcessingRef.current = false;
      setStatus('listening');
    }
  }, [transcribeAudio, captureFrameWithRetry, getAIResponse, speakText, interruptSpeech]);

  // ── Continuous listening with silence detection + interruption ──
  const startListening = useCallback(async () => {
    if (!shouldListenRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      audioCtxRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;
      setActiveAnalyser(analyser);
      silenceStartRef.current = 0;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SILENCE_THRESHOLD = 15;
      const SILENCE_DURATION = 1400;
      let hasSpoken = false;

      const check = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        // Interruption: if user speaks while AI is speaking, stop AI
        if (avg >= SILENCE_THRESHOLD && isSpeakingRef.current) {
          interruptSpeech();
        }

        if (avg >= SILENCE_THRESHOLD) {
          hasSpoken = true;
          silenceStartRef.current = 0;
        } else if (hasSpoken) {
          if (silenceStartRef.current === 0) silenceStartRef.current = Date.now();
          else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
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
        setActiveAnalyser(null);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) await processConversation(audioBlob);
        if (shouldListenRef.current) setTimeout(() => startListening(), 150);
      };

      mediaRecorder.start(250);
      setStatus('listening');
      rafRef.current = requestAnimationFrame(check);
    } catch {
      toast.error('Microphone access denied');
    }
  }, [processConversation, interruptSpeech]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    analyserRef.current = null;
    setActiveAnalyser(null);
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    audioCtxRef.current?.close().catch(() => {});
    setStatus('idle');
  }, []);

  // ── Init ──
  useEffect(() => {
    if (open) {
      shouldListenRef.current = true;
      startCamera(facingMode);
      startListening();
      toast.success('🔴 Live Mode Active!');
    }
    return () => {
      shouldListenRef.current = false;
      stopListening();
      streamRef.current?.getTracks().forEach(t => t.stop());
      window.speechSynthesis?.cancel();
    };
  }, [open]);

  const toggleCamera = useCallback(() => {
    if (isCameraOn) {
      streamRef.current?.getVideoTracks().forEach(t => t.stop());
      setIsCameraOn(false);
    } else {
      startCamera(facingMode);
      setIsCameraOn(true);
    }
  }, [isCameraOn, facingMode, startCamera]);

  const switchCamera = useCallback(() => {
    const nf = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nf);
    if (isCameraOn) startCamera(nf);
  }, [facingMode, isCameraOn, startCamera]);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      stopListening();
      setIsMicOn(false);
    } else {
      setIsMicOn(true);
      shouldListenRef.current = true;
      startListening();
    }
  }, [isMicOn, stopListening, startListening]);

  const toggleSpeaker = useCallback(() => setIsSpeakerOn(p => !p), []);

  const handleEndCall = useCallback(() => {
    stopListening();
    streamRef.current?.getTracks().forEach(t => t.stop());
    window.speechSynthesis?.cancel();
    setConversationHistory([]);
    setTranscript('');
    setAiResponse('');
    setStatus('idle');
    onClose();
  }, [stopListening, onClose]);

  if (!open) return null;

  const statusLabels: Record<string, string> = {
    idle: 'Ready',
    listening: '🎙️ Listening...',
    thinking: '🧠 Thinking...',
    speaking: '🔊 Speaking...'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Main area: wave animation background ── */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Full-screen audio wave */}
        <div className="absolute inset-0 z-0">
          <LiveAudioWave status={status} analyser={activeAnalyser} />
        </div>

        {/* Floating camera preview (top-right corner) */}
        <div className={`absolute top-16 right-4 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-300 ${
          isCameraOn 
            ? 'w-32 h-44 sm:w-40 sm:h-56 border-emerald-500/50' 
            : 'w-24 h-24 border-muted/30'
        }`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${!isCameraOn ? 'hidden' : ''}`}
          />
          {!isCameraOn && (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 backdrop-blur-md">
              <CameraOff className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {/* Camera switch button overlay */}
          {isCameraOn && (
            <button
              onClick={switchCamera}
              className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-colors"
            >
              <SwitchCamera className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-white text-sm font-semibold backdrop-blur-xl bg-white/10 border border-white/10 shadow-lg">
            <div className={`h-2.5 w-2.5 rounded-full transition-colors ${
              status === 'listening' ? 'bg-emerald-400 animate-pulse shadow-emerald-400/50 shadow-lg' :
              status === 'thinking' ? 'bg-amber-400 animate-pulse shadow-amber-400/50 shadow-lg' :
              status === 'speaking' ? 'bg-blue-400 animate-pulse shadow-blue-400/50 shadow-lg' :
              'bg-muted-foreground/40'
            }`} />
            {statusLabels[status]}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white/80 hover:bg-white/20 border border-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Center content: Study AI branding */}
        <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
            <span className="text-3xl">🧠</span>
          </div>
          <p className="text-white/50 text-xs font-medium tracking-wider uppercase">Study AI Live</p>
        </div>

        {/* Transcript overlay (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="max-w-lg mx-auto space-y-2.5">
            {transcript && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">You</p>
                <p className="text-white/90 text-sm leading-relaxed">{transcript}</p>
              </div>
            )}
            {aiResponse && (
              <div className="bg-emerald-500/10 backdrop-blur-xl rounded-2xl px-4 py-3 border border-emerald-500/20">
                <p className="text-emerald-400/60 text-[10px] font-semibold uppercase tracking-wider mb-1">Study AI</p>
                <p className="text-white/90 text-sm leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Control bar ── */}
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/5 px-6 py-5 safe-area-bottom">
        <div className="flex items-center justify-center gap-5 max-w-xs mx-auto">
          <Button onClick={toggleMic} variant="ghost" size="icon"
            className={`h-14 w-14 rounded-full border transition-all ${
              isMicOn 
                ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' 
                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
            }`}>
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          <Button onClick={toggleSpeaker} variant="ghost" size="icon"
            className={`h-14 w-14 rounded-full border transition-all ${
              isSpeakerOn 
                ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' 
                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
            }`}>
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>

          <Button onClick={handleEndCall} variant="ghost" size="icon"
            className="h-[68px] w-[68px] rounded-full bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/30 border-0">
            <Phone className="h-7 w-7 rotate-[135deg]" />
          </Button>

          <Button onClick={toggleCamera} variant="ghost" size="icon"
            className={`h-14 w-14 rounded-full border transition-all ${
              isCameraOn 
                ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' 
                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
            }`}>
            {isCameraOn ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
          </Button>

          <Button onClick={switchCamera} variant="ghost" size="icon" disabled={!isCameraOn}
            className="h-14 w-14 rounded-full bg-white/10 text-white border border-white/10 hover:bg-white/20 disabled:opacity-20">
            <SwitchCamera className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveTalkingMode;
