import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Copy, Trash, ThumbsUp, ThumbsDown, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LongPressMenuProps {
  children: React.ReactNode;
  isUserMessage: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onListen?: () => void;
  isLiked?: boolean;
}

const LONG_PRESS_DURATION = 600; // ms — snappy for mobile

const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  isUserMessage,
  onCopy,
  onDelete,
  onLike,
  onDislike,
  onListen,
  isLiked,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const startPress = useCallback((clientX: number, clientY: number) => {
    timerRef.current = setTimeout(() => {
      // Position menu near the press point
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = Math.min(clientX - rect.left, rect.width - 180);
        const y = clientY - rect.top - 50;
        setMenuPos({ x: Math.max(0, x), y: Math.max(0, y) });
      }
      setShowMenu(true);
    }, LONG_PRESS_DURATION);
  }, []);

  const cancelPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPress(touch.clientX, touch.clientY);
  };

  // Mouse events (desktop fallback)
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    startPress(e.clientX, e.clientY);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    document.addEventListener('click', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('touchstart', close);
    };
  }, [showMenu]);

  const handleAction = (action: () => void) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={onTouchStart}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onMouseDown={onMouseDown}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
    >
      {children}

      {showMenu && (
        <div
          className={cn(
            "absolute z-50 animate-in fade-in-0 zoom-in-95 duration-150",
            "bg-popover border border-border rounded-xl shadow-lg py-1.5 px-1",
            "min-w-[160px]"
          )}
          style={{ left: menuPos.x, top: menuPos.y }}
          onClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-muted rounded-lg transition-colors"
            onClick={handleAction(onCopy)}
          >
            <Copy className="h-4 w-4" /> Copy
          </button>

          {isUserMessage && (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              onClick={handleAction(onDelete)}
            >
              <Trash className="h-4 w-4" /> Delete
            </button>
          )}

          {!isUserMessage && onLike && (
            <button
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors",
                isLiked ? "text-primary" : "text-foreground/80"
              )}
              onClick={handleAction(onLike)}
            >
              <ThumbsUp className="h-4 w-4" /> Like
            </button>
          )}

          {!isUserMessage && onDislike && (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-muted rounded-lg transition-colors"
              onClick={handleAction(onDislike)}
            >
              <ThumbsDown className="h-4 w-4" /> Dislike
            </button>
          )}

          {!isUserMessage && onListen && (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-muted rounded-lg transition-colors"
              onClick={handleAction(onListen)}
            >
              <Volume2 className="h-4 w-4" /> Listen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LongPressMenu;
