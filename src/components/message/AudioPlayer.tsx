import React from 'react';
import { Play, Pause, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  isGenerating: boolean;
  isPlaying: boolean;
  audioReady: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  onTogglePlay: () => void;
  onCancel: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isGenerating,
  isPlaying,
  audioReady,
  progress,
  duration,
  currentTime,
  onTogglePlay,
  onCancel,
}) => {
  if (isGenerating) {
    return (
      <div className="flex items-center gap-3 mt-3 px-4 py-2.5 bg-muted/50 rounded-xl border border-border/40">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Audio generate हो रहा है...</span>
        <button onClick={onCancel} className="ml-auto text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!audioReady) return null;

  return (
    <div className="flex items-center gap-3 mt-3 px-4 py-2.5 bg-muted/30 rounded-xl border border-border/30">
      <button
        onClick={onTogglePlay}
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          "bg-foreground text-background hover:bg-foreground/80"
        )}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/70 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AudioPlayer;
