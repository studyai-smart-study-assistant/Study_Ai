import React, { createContext, useContext, useState, useCallback } from 'react';
import { YouTubeVideo } from '@/services/youtubeService';

interface MiniPlayerState {
  video: YouTubeVideo | null;
  isPlaying: boolean;
  isMinimized: boolean;
}

interface MiniPlayerContextType {
  state: MiniPlayerState;
  playVideo: (video: YouTubeVideo) => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
  closePlayer: () => void;
  togglePlayPause: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | null>(null);

export const useMiniPlayer = () => {
  const ctx = useContext(MiniPlayerContext);
  if (!ctx) throw new Error('useMiniPlayer must be used within MiniPlayerProvider');
  return ctx;
};

export const MiniPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MiniPlayerState>({
    video: null,
    isPlaying: false,
    isMinimized: false,
  });

  const playVideo = useCallback((video: YouTubeVideo) => {
    setState({ video, isPlaying: true, isMinimized: false });
  }, []);

  const minimizePlayer = useCallback(() => {
    setState(prev => prev.video ? { ...prev, isMinimized: true } : prev);
  }, []);

  const maximizePlayer = useCallback(() => {
    setState(prev => prev.video ? { ...prev, isMinimized: false } : prev);
  }, []);

  const closePlayer = useCallback(() => {
    setState({ video: null, isPlaying: false, isMinimized: false });
  }, []);

  const togglePlayPause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  return (
    <MiniPlayerContext.Provider value={{ state, playVideo, minimizePlayer, maximizePlayer, closePlayer, togglePlayPause }}>
      {children}
    </MiniPlayerContext.Provider>
  );
};
