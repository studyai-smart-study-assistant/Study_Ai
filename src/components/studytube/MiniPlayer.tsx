import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMiniPlayer } from '@/contexts/MiniPlayerContext';
import { X, Maximize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MiniPlayer: React.FC = () => {
  const { state, closePlayer, maximizePlayer } = useMiniPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, elemX: 0, elemY: 0 });
  const hasMoved = useRef(false);

  // Reset position when video changes
  useEffect(() => { setPos({ x: 0, y: 0 }); }, [state.video?.id?.videoId]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    hasMoved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY, elemX: pos.x, elemY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    setPos({ x: startPos.current.elemX + dx, y: startPos.current.elemY + dy });
  }, [isDragging]);

  const onPointerUp = useCallback(() => { setIsDragging(false); }, []);

  if (!state.video) return null;
  if (location.pathname === '/study-tube' && !state.isMinimized) return null;

  const videoId = state.video.id.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  const handleMaximize = () => {
    if (hasMoved.current) return;
    maximizePlayer();
    if (location.pathname !== '/study-tube') navigate('/study-tube');
  };

  return (
    <div
      ref={dragRef}
      className="fixed z-[60] touch-none select-none"
      style={{
        bottom: `calc(4.5rem + ${-pos.y}px)`,
        right: `calc(0.5rem + ${-pos.x}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="bg-black rounded-lg overflow-hidden shadow-2xl border border-border/30 w-[200px] sm:w-[240px]">
        {/* Tiny video */}
        <div className="relative w-full h-[112px] sm:h-[135px] bg-black pointer-events-none">
          <iframe
            src={embedUrl}
            title={state.video.snippet.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>

        {/* Compact controls */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-900">
          <p className="flex-1 min-w-0 text-white text-[10px] font-medium truncate leading-tight">
            {state.video.snippet.title}
          </p>
          <button onClick={handleMaximize} className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0">
            <Maximize2 className="h-3 w-3 text-white" />
          </button>
          <button onClick={closePlayer} className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0">
            <X className="h-3 w-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
