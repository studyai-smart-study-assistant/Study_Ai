
import React, { useState, useRef, useCallback } from 'react';
import { Copy, Reply, Volume2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Emoji reactions
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageAction {
  id: string;
  text: string | null;
  isMine: boolean;
  senderName?: string;
}

interface MessageLongPressMenuProps {
  message: MessageAction | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onReply: (msg: MessageAction) => void;
  onReact: (msgId: string, emoji: string) => void;
  onDelete?: (msgId: string) => void;
  onSpeak?: (text: string) => void;
}

// Use Sarvam AI TTS
async function speakWithSarvamAI(text: string) {
  try {
    toast.info('🔊 आवाज़ तैयार हो रही है...', { duration: 2000 });
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text, language: 'hi-IN', voice: 'shubh' },
    });
    if (error || !data?.audioContent) {
      throw new Error('TTS failed');
    }
    const binaryStr = atob(data.audioContent);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = 1.1;
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
  } catch {
    // Fallback to Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      speechSynthesis.speak(utterance);
    } else {
      toast.error('TTS उपलब्ध नहीं है');
    }
  }
}

export const MessageLongPressMenu: React.FC<MessageLongPressMenuProps> = ({
  message, position, onClose, onReply, onReact, onDelete, onSpeak
}) => {
  if (!message || !position) return null;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success('Copy हो गया! 📋');
    }
    onClose();
  };

  const handleReply = () => {
    onReply(message);
    onClose();
  };

  const handleSpeak = () => {
    if (message.text) {
      if (onSpeak) {
        onSpeak(message.text);
      } else {
        speakWithSarvamAI(message.text);
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) onDelete(message.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        className="absolute bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y - 120, window.innerHeight - 200),
          minWidth: '200px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Emoji row */}
        <div className="flex items-center justify-around px-2 py-2.5 border-b border-border">
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onReact(message.id, emoji); onClose(); }}
              className="text-xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="py-1">
          <button onClick={handleReply} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
            <Reply className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Reply</span>
          </button>
          <button onClick={handleCopy} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
            <Copy className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Copy</span>
          </button>
          <button onClick={handleSpeak} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">आवाज़ में सुनें</span>
          </button>
          {message.isMine && onDelete && (
            <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Reply preview bar
interface ReplyPreviewProps {
  replyTo: { id: string; text: string | null; senderName?: string } | null;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;
  return (
    <div className="px-3 py-2 bg-[hsl(230,70%,55%)]/5 border-t border-[hsl(230,70%,55%)]/20 flex items-center gap-2">
      <div className="w-1 h-8 bg-[hsl(230,70%,55%)] rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[hsl(230,70%,55%)]">{replyTo.senderName || 'Message'}</p>
        <p className="text-xs text-muted-foreground truncate">{replyTo.text || '📷 Photo'}</p>
      </div>
      <button onClick={onCancel} className="p-1 hover:bg-muted rounded-full">
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

// Quoted message inside a bubble
interface QuotedMessageProps {
  text: string | null;
  senderName?: string;
}

export const QuotedMessage: React.FC<QuotedMessageProps> = ({ text, senderName }) => {
  return (
    <div className="bg-black/5 dark:bg-white/5 rounded-lg px-2.5 py-1.5 mb-1 border-l-2 border-[hsl(230,70%,55%)]">
      <p className="text-[10px] font-semibold text-[hsl(230,70%,55%)]">{senderName || 'Message'}</p>
      <p className="text-xs text-muted-foreground truncate">{text || '📷 Photo'}</p>
    </div>
  );
};

// Reactions display
interface ReactionsDisplayProps {
  reactions: Record<string, string[]>; // emoji -> userIds
}

export const ReactionsDisplay: React.FC<ReactionsDisplayProps> = ({ reactions }) => {
  const entries = Object.entries(reactions).filter(([_, users]) => users.length > 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <span key={emoji} className="inline-flex items-center gap-0.5 bg-muted rounded-full px-1.5 py-0.5 text-xs">
          {emoji} {users.length > 1 && <span className="text-[10px] text-muted-foreground">{users.length}</span>}
        </span>
      ))}
    </div>
  );
};

// Swipe to reply hook
export const useSwipeToReply = (onSwipe: () => void) => {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff > 0 && diff < 80) {
      setOffset(diff);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (offset > 50) {
      onSwipe();
    }
    setOffset(0);
    swiping.current = false;
  }, [offset, onSwipe]);

  return { offset, onTouchStart, onTouchMove, onTouchEnd };
};

// Long press hook
export const useLongPress = (onLongPress: (e: React.TouchEvent | React.MouseEvent) => void, delay = 500) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    triggered.current = false;
    timerRef.current = setTimeout(() => {
      triggered.current = true;
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  };
};

export type { MessageAction };
