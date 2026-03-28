
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, CameraOff, SwitchCamera, X, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LiveAudioWave from './LiveAudioWave';

interface LiveTalkingModeProps {
  open: boolean;
  onClose: () => void;
}

const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.GenerateContent';

const LiveTalkingMode: React.FC<LiveTalkingModeProps> = ({ open, onClose }) => {
  const [isLive, setIsLive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [aiResponse, setAiResponse] = useState('');
  const [activeAnalyser, setActiveAnalyser] = useState<AnalyserNode | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isConnectedRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const cleanup = useCallback(() => {
    isConnectedRef.current = false;
    wsRef.current?.close();
    wsRef.current = null;

    micStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());

    audioCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current?.close().catch(() => {});
    workletNodeRef.current?.port.close();

    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

    setActiveAnalyser(null);
    setStatus('idle');
    console.log("Live Mode Cleanup Complete");
  }, []);
  
  const handleEndCall = useCallback(() => {
    cleanup();
    setIsLive(false);
    onClose();
  }, [cleanup, onClose]);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    } catch {
      toast.error('Camera access denied. Please enable it in your browser settings.');
      setIsCameraOn(false);
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn) return null;
    const v = videoRef.current;
    if (v.readyState < 2 || v.videoWidth === 0) return null;
    const c = canvasRef.current;
    c.width = 320;
    c.height = Math.max(180, Math.round(320 * (v.videoHeight / v.videoWidth)));
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.5);
    return dataUrl.split(',')[1] || null;
  }, [isCameraOn]);

  const playAudioChunk = useCallback((pcmBase64: string) => {
    try {
      const binaryStr = atob(pcmBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

      if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const ctx = playbackCtxRef.current;
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      playbackSourceRef.current = source;

      isSpeakingRef.current = true;
      setStatus('speaking');
      source.onended = () => {
        isSpeakingRef.current = false;
        if (isConnectedRef.current) setStatus('listening');
      };
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }, []);

  const interruptPlayback = useCallback(() => {
    if (isSpeakingRef.current) {
      try {
        playbackSourceRef.current?.stop();
      } catch {}
      isSpeakingRef.current = false;
      setStatus('listening');
    }
  }, []);
  
  const connectWebSocket = useCallback(async () => {
    setStatus('idle');
    try {
      const { data, error } = await supabase.functions.invoke('gemini-live-token');
      if (error || !data?.apiKey || !data?.model) {
        toast.error('Failed to get API key. Please try again.');
        console.error('Token acquisition failed:', error);
        handleEndCall();
        return;
      }

      const { apiKey, model: modelToUse } = data;
      const ws = new WebSocket(`${GEMINI_WS_URL}&key=${apiKey}&model=${modelToUse}`);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        setStatus('listening');
        toast.success(`🔴 Live Mode Active`);
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            console.error('Gemini error:', msg.error.message);
            toast.error(msg.error.message);
            handleEndCall();
            return;
          }
          const candidate = msg.candidates?.[0];
          if (!candidate) return;
          const content = candidate.content;
          if (content?.parts) {
            for (const part of content.parts) {
              if (part.audioData?.data) playAudioChunk(part.audioData.data);
              if (part.text) setAiResponse(prev => (prev ? prev + ' ' + part.text : part.text).trim());
            }
          }
          if (candidate.finishReason === 'COMPLETE' || candidate.finishReason === 'STOP') {
             isSpeakingRef.current = false;
             if (isConnectedRef.current) setStatus('listening');
          }
        } catch (e) { console.error('WS message parse error:', e); }
      };

      ws.onerror = (e) => { console.error('WebSocket error:', e); toast.error('Live connection failed.'); };
      ws.onclose = () => { if (isConnectedRef.current) { toast.info('Live connection closed.'); } handleEndCall(); };
    } catch (e) {
      console.error('WebSocket connect error:', e);
      toast.error('Failed to connect to the live service.');
      handleEndCall();
    }
  }, [handleEndCall, playAudioChunk]);

  const startMicStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;
      setIsMicOn(true);

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      await audioCtx.audioWorklet.addModule('/audio-processor.js');
      
      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-audio-processor');
      workletNodeRef.current = workletNode;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;
      setActiveAnalyser(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      workletNode.port.onmessage = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnectedRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg > 15 && isSpeakingRef.current) {
          interruptPlayback();
          setAiResponse('');
        }
        
        const pcm16Buffer = event.data as ArrayBuffer;
        const uint8 = new Uint8Array(pcm16Buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const b64 = btoa(binary);

        const msg = { content: { parts: [{ inlineData: { mimeType: 'audio/l16; rate=16000', data: b64 } }] } };
        wsRef.current.send(JSON.stringify(msg));
      };
      source.connect(analyser);
      analyser.connect(workletNode);
      workletNode.connect(audioCtx.destination);
    } catch (err) {
      console.error('Mic stream error:', err);
      toast.error('Microphone access denied. Please enable it in your browser settings.');
      setIsMicOn(false);
    }
  }, [interruptPlayback]);
  
  const startFrameStream = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnectedRef.current || !isCameraOn) return;
      const frame = captureFrame();
      if (!frame) return;
      const msg = { content: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: frame } }] } };
      wsRef.current.send(JSON.stringify(msg));
    }, 2500);
  }, [captureFrame, isCameraOn]);
  
  const handleStartLiveMode = () => setIsLive(true);
  
  useEffect(() => {
    if (open && isLive) {
      startCamera(facingMode);
      connectWebSocket();
      startMicStream();
    }
  }, [open, isLive]);

  useEffect(() => {
    if (!open) {
      cleanup();
      setIsLive(false);
    }
  }, [open, cleanup]);
  
  useEffect(() => {
    if (open && isLive && isCameraOn && isConnectedRef.current) {
      startFrameStream();
    }
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [open, isLive, isCameraOn, isConnectedRef.current, startFrameStream]);

  const toggleCamera = useCallback(() => {
    setIsCameraOn(prev => {
      if (!prev) startCamera(facingMode);
      else cameraStreamRef.current?.getVideoTracks().forEach(t => t.stop());
      return !prev;
    });
  }, [facingMode, startCamera]);
  
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    if (isCameraOn) startCamera(newFacingMode);
  }, [facingMode, isCameraOn, startCamera]);

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      micStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !prev);
      return !prev;
    });
  }, []);

  if (!open) return null;

  const statusLabels: Record<string, string> = {
    idle: '⏳ Connecting...',
    listening: '🎙️ Listening...',
    thinking: '🧠 Thinking...',
    speaking: '🔊 Speaking...',
  };

  if (!isLive) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl mb-6">
            <span className="text-3xl">🧠</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">लाइव टॉकिंग मोड</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          अपने कैमरे और माइक्रोफ़ोन का उपयोग करके AI के साथ लाइव बातचीत करें। जारी रखने के लिए आपको अनुमति देने के लिए कहा जाएगा।
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleStartLiveMode} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 text-base">
                <Mic className="mr-2 h-5 w-5" />
                सेशन शुरू करें
            </Button>
            <Button onClick={onClose} variant="ghost" size="lg" className="h-12 px-8 text-base">
                रद्द करें
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 z-0"><LiveAudioWave status={status} analyser={activeAnalyser} /></div>
        <div className={`absolute top-16 right-4 z-20 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-300 ${isCameraOn ? 'w-32 h-44 sm:w-40 sm:h-56 border-emerald-500/50' : 'w-24 h-24 border-muted/30'}`}>
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${!isCameraOn ? 'hidden' : ''}`} />
          {!isCameraOn && <div className="w-full h-full flex items-center justify-center bg-muted/20 backdrop-blur-md"><CameraOff className="h-8 w-8 text-muted-foreground/50" /></div>}
          {isCameraOn && <button onClick={switchCamera} className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-colors"><SwitchCamera className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-white text-sm font-semibold backdrop-blur-xl bg-white/10 border border-white/10 shadow-lg">
            <div className={`h-2.5 w-2.5 rounded-full transition-colors ${status === 'listening' ? 'bg-emerald-400 animate-pulse' : status === 'speaking' ? 'bg-blue-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
            {statusLabels[status]}
          </div>
        </div>
        <button onClick={handleEndCall} className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white/80 hover:bg-white/20 border border-white/10 transition-colors"><X className="h-5 w-5" /></button>
        <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl"><span className="text-3xl">🧠</span></div>
          <p className="text-white/50 text-xs font-medium tracking-wider uppercase">Study AI Live</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="max-w-lg mx-auto">
            {aiResponse && <div className="bg-emerald-500/10 backdrop-blur-xl rounded-2xl px-4 py-3 border border-emerald-500/20"><p className="text-emerald-400/60 text-[10px] font-semibold uppercase tracking-wider mb-1">Study AI</p><p className="text-white/90 text-sm leading-relaxed">{aiResponse}</p></div>}
          </div>
        </div>
      </div>
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/5 px-6 py-5 safe-area-bottom">
        <div className="flex items-center justify-center gap-5 max-w-xs mx-auto">
          <Button onClick={toggleMic} variant="ghost" size="icon" className={`h-14 w-14 rounded-full border transition-all ${isMicOn ? 'bg-white/10 text-white border-white/10' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}</Button>
          <Button onClick={handleEndCall} variant="ghost" size="icon" className="h-[68px] w-[68px] rounded-full bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-600/30 border-0"><Phone className="h-7 w-7 rotate-[135deg]" /></Button>
          <Button onClick={toggleCamera} variant="ghost" size="icon" className={`h-14 w-14 rounded-full border transition-all ${isCameraOn ? 'bg-white/10 text-white border-white/10' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{isCameraOn ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}</Button>
        </div>
      </div>
    </div>
  );
};

export default LiveTalkingMode;
