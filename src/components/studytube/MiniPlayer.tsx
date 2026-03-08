import React from 'react';
import { useMiniPlayer } from '@/contexts/MiniPlayerContext';
import { X, Maximize2, Pause, Play } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MiniPlayer: React.FC = () => {
  const { state, closePlayer, maximizePlayer, togglePlayPause } = useMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show mini player if no video or if on StudyTube page and not minimized
  if (!state.video) return null;
  if (location.pathname === '/study-tube' && !state.isMinimized) return null;

  const videoId = state.video.id.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  const handleMaximize = () => {
    maximizePlayer();
    if (location.pathname !== '/study-tube') {
      navigate('/study-tube');
    }
  };

  return (
    <div className="fixed bottom-16 right-2 left-2 sm:left-auto sm:right-4 sm:bottom-20 z-[60] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 w-full sm:w-[360px]">
        {/* Video */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={state.video.snippet.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900">
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {state.video.snippet.title}
            </p>
            <p className="text-gray-400 text-[10px] truncate">
              {state.video.snippet.channelTitle}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
              title="Maximize"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={closePlayer}
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
