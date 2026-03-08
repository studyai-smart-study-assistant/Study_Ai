
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CallScreenProps {
  channelName: string;
  isVideo: boolean;
  callerName: string;
  callerAvatar?: string | null;
  onEnd: () => void;
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];
const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

const CallScreen: React.FC<CallScreenProps> = ({ channelName, isVideo, callerName, callerAvatar, onEnd }) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideo);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        setClient(agoraClient);

        // Get Agora config from edge function
        const { data, error } = await supabase.functions.invoke('agora-token', {
          body: { channelName, uid: 0 }
        });

        if (error || !data?.appId) {
          console.error('Agora config error:', error);
          onEnd();
          return;
        }

        // Event handlers
        agoraClient.on('user-published', async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        });

        agoraClient.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? user : u));
          }
        });

        agoraClient.on('user-left', (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        // Join channel
        await agoraClient.join(data.appId, channelName, data.token, data.uid || 0);

        // Create and publish tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);

        if (isVideo) {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          setLocalVideoTrack(videoTrack);
          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
          }
          await agoraClient.publish([audioTrack, videoTrack]);
        } else {
          await agoraClient.publish([audioTrack]);
        }

        setIsConnecting(false);

        // Start timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

      } catch (err) {
        console.error('Call init error:', err);
        onEnd();
      }
    };

    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [channelName, isVideo]);

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    localAudioTrack?.close();
    localVideoTrack?.close();
    await client?.leave();
    onEnd();
  }, [client, localAudioTrack, localVideoTrack, onEnd]);

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (isVideoOff) {
      // Turn on video
      try {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);
        if (localVideoRef.current) videoTrack.play(localVideoRef.current);
        await client?.publish([videoTrack]);
        setIsVideoOff(false);
      } catch (err) {
        console.error('Video toggle error:', err);
      }
    } else {
      // Turn off video
      localVideoTrack?.close();
      await client?.unpublish(localVideoTrack ? [localVideoTrack] : []);
      setLocalVideoTrack(null);
      setIsVideoOff(true);
    }
  };

  const hasRemoteVideo = remoteUsers.some(u => u.hasVideo);

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a1a2e] flex flex-col">
      {/* Background */}
      {isVideo && hasRemoteVideo ? (
        // Full screen remote video
        <div ref={remoteVideoRef} className="absolute inset-0" />
      ) : (
        // Audio call or no remote video - show avatar
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName} className="w-28 h-28 rounded-full object-cover border-4 border-white/20" />
            ) : (
              <div className={`w-28 h-28 rounded-full ${getColor(callerName)} flex items-center justify-center text-white font-bold text-4xl border-4 border-white/20`}>
                {callerName.charAt(0).toUpperCase()}
              </div>
            )}
            {isConnecting && (
              <div className="absolute inset-0 rounded-full border-4 border-green-400 border-t-transparent animate-spin" />
            )}
          </div>
          <h2 className="text-white text-2xl font-bold mt-6">{callerName}</h2>
          <p className="text-white/60 text-sm mt-1">
            {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
          </p>
          {!isConnecting && remoteUsers.length === 0 && (
            <p className="text-white/40 text-xs mt-2">Ringing...</p>
          )}
        </div>
      )}

      {/* Local video (small pip) */}
      {isVideo && !isVideoOff && (
        <div
          ref={localVideoRef}
          className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-10"
        />
      )}

      {/* Call duration overlay for video */}
      {isVideo && hasRemoteVideo && !isConnecting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full z-10">
          <p className="text-white text-sm font-medium">{formatDuration(callDuration)}</p>
        </div>
      )}

      {/* Controls */}
      <div className="shrink-0 pb-12 pt-6 px-6">
        <div className="flex items-center justify-center gap-6">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-white text-[#1a1a2e]' : 'bg-white/20 text-white'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          {/* Video toggle */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoOff ? 'bg-white text-[#1a1a2e]' : 'bg-white/20 text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </button>
          )}

          {/* Speaker */}
          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              !isSpeaker ? 'bg-white text-[#1a1a2e]' : 'bg-white/20 text-white'
            }`}
          >
            <Volume2 className="h-6 w-6" />
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
