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

const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const LiveTalkingMode: React.FC<LiveTalkingModeProps> = ({ open, onClose }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [activeAnalyser, setActiveAnalyser] = useState<AnalyserNode | null>(null);
  const [liveModel, setLiveModel] = useState('models/gemini-2.0-flash-live-001');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const isConnectedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const pendingAudioRef = useRef<Float32Array[]>([]);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // ── Camera ──
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Camera access denied');
      setIsCameraOn(false);
    }
  }, []);

  // ── Capture frame as base64 JPEG ──
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
    // Return raw base64 without prefix
    return dataUrl.split(',')[1] || null;
  }, [isCameraOn]);

  // ── Play received PCM audio ──
  const playAudioChunk = useCallback((pcmBase64: string) => {
    if (!isSpeakerOn) return;
    try {
      const binaryStr = atob(pcmBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      // Convert PCM 16-bit LE to Float32
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
  }, [isSpeakerOn]);

  // ── Interrupt: stop AI audio ──
  const interruptPlayback = useCallback(() => {
    if (isSpeakingRef.current) {
      try {
        playbackSourceRef.current?.stop();
      } catch {}
      isSpeakingRef.current = false;
      setStatus('listening');
    }
  }, []);

  // ── Connect WebSocket to Gemini ──
  const connectWebSocket = useCallback(async () => {
    try {
      // Get API key from edge function
      const { data, error } = await supabase.functions.invoke('gemini-live-token');
      if (error || !data?.apiKey) {
        toast.error('Failed to get API key');
        return;
      }

      const selectedLiveModel = data?.model || liveModel;
      setLiveModel(selectedLiveModel);

      const ws = new WebSocket(`${GEMINI_WS_URL}?key=${data.apiKey}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Gemini WebSocket connected');
        // Send setup message
        const setupMsg = {
          setup: {
            model: liveModel,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede'
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{
                text: `You are Study AI Live, a real-time multimodal AI teacher built by Ajit Kumar. You help students learn by seeing their books, notes, diagrams through the camera and explaining concepts verbally. Keep responses concise (2-4 sentences) since you're speaking live. Respond in the same language as the student (Hindi or English). If the student shows a diagram or equation, explain it clearly. Be encouraging and patient like a good teacher.`
              }]
            }
          }
        };
        ws.send(JSON.stringify(setupMsg));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Setup complete
          if (msg.setupComplete) {
            console.log('Gemini setup complete');
            isConnectedRef.current = true;
            setStatus('listening');
            toast.success('🔴 Live Mode Active — Gemini Connected!');
            return;
          }

          // Server content (AI response)
          if (msg.serverContent) {
            const parts = msg.serverContent.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                // Audio response
                if (part.inlineData?.mimeType?.startsWith('audio/')) {
                  playAudioChunk(part.inlineData.data);
                }
                // Text response (transcript of AI speech)
                if (part.text) {
                  setAiResponse(prev => prev ? prev + ' ' + part.text : part.text);
                }
              }
            }

            // Turn complete
            if (msg.serverContent.turnComplete) {
              isSpeakingRef.current = false;
              if (isConnectedRef.current) setStatus('listening');
            }
          }
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        toast.error('Live connection failed');
      };

      ws.onclose = (e) => {
        console.log('WebSocket closed:', e.code, e.reason);
        isConnectedRef.current = false;
        setStatus('idle');
        // Auto-reconnect if still open
        if (open) {
          setTimeout(() => connectWebSocket(), 2000);
        }
      };
    } catch (e) {
      console.error('WebSocket connect error:', e);
      toast.error('Failed to connect');
    }
  }, [open, playAudioChunk, liveModel]);

  // ── Stream mic audio as PCM 16kHz via WebSocket ──
  const startMicStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;
      setActiveAnalyser(analyser);

      // Use ScriptProcessorNode for PCM capture (worklet would be better but simpler this way)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnectedRef.current) return;

        // Check volume for interruption
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        // Interrupt AI if user speaks
        if (avg > 15 && isSpeakingRef.current) {
          interruptPlayback();
          setTranscript('');
          setAiResponse('');
        }

        // Convert Float32 to PCM 16-bit LE
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const b64 = btoa(binary);

        // Send audio chunk
        const msg = {
          realtimeInput: {
            mediaChunks: [{
              data: b64,
              mimeType: 'audio/pcm;rate=16000',
            }]
          }
        };
        wsRef.current.send(JSON.stringify(msg));
      };
    } catch {
      toast.error('Microphone access denied');
    }
  }, [interruptPlayback]);

  // ── Stream camera frames periodically ──
  const startFrameStream = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

    frameIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isConnectedRef.current || !isCameraOn) return;

      const frame = captureFrame();
      if (!frame) return;

      const msg = {
        realtimeInput: {
          mediaChunks: [{
            data: frame,
            mimeType: 'image/jpeg',
          }]
        }
      };
      wsRef.current.send(JSON.stringify(msg));
    }, 2000); // Send frame every 2 seconds
  }, [captureFrame, isCameraOn]);

  // ── Init ──
  useEffect(() => {
    if (open) {
      startCamera(facingMode);
      connectWebSocket();
      startMicStream();
    }
    return () => {
      isConnectedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      playbackCtxRef.current?.close().catch(() => {});
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      setActiveAnalyser(null);
      analyserRef.current = null;
      setStatus('idle');
    };
  }, [open]);

  // Connection watchdog: prevent infinite "Connecting..." state
  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      if (!isConnectedRef.current && status === 'idle') {
        toast.error('Live connection timeout — retrying...');
        wsRef.current?.close();
        connectWebSocket();
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [open, status, connectWebSocket]);

  // Start frame streaming when camera/connection changes
  useEffect(() => {
    if (open && isCameraOn && isConnectedRef.current) {
      startFrameStream();
    }
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [open, isCameraOn, startFrameStream]);

  const toggleCamera = useCallback(() => {
    if (isCameraOn) {
      cameraStreamRef.current?.getVideoTracks().forEach(t => t.stop());
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
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      setActiveAnalyser(null);
      analyserRef.current = null;
      setIsMicOn(false);
    } else {
      setIsMicOn(true);
      startMicStream();
    }
  }, [isMicOn, startMicStream]);

  const toggleSpeaker = useCallback(() => setIsSpeakerOn(p => !p), []);

  const handleEndCall = useCallback(() => {
    isConnectedRef.current = false;
    wsRef.current?.close();
    wsRef.current = null;
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current?.close().catch(() => {});
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    setActiveAnalyser(null);
    analyserRef.current = null;
    setTranscript('');
    setAiResponse('');
    setStatus('idle');
    onClose();
  }, [onClose]);

  if (!open) return null;

  const statusLabels: Record<string, string> = {
    idle: '⏳ Connecting...',
    listening: '🎙️ Listening...',
    thinking: '🧠 Thinking...',
    speaking: '🔊 Speaking...',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Main area: wave animation */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <LiveAudioWave status={status} analyser={activeAnalyser} />
        </div>

        {/* Floating camera preview */}
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

        {/* Center branding */}
        <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
            <span className="text-3xl">🧠</span>
          </div>
          <p className="text-white/50 text-xs font-medium tracking-wider uppercase">Study AI Live</p>
          <p className="text-white/30 text-[10px] tracking-wide">Gemini Multimodal • WebSocket</p>
        </div>

        {/* AI Response overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="max-w-lg mx-auto">
            {aiResponse && (
              <div className="bg-emerald-500/10 backdrop-blur-xl rounded-2xl px-4 py-3 border border-emerald-500/20">
                <p className="text-emerald-400/60 text-[10px] font-semibold uppercase tracking-wider mb-1">Study AI</p>
                <p className="text-white/90 text-sm leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control bar */}
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
