
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock } from 'lucide-react';
import { formatTime } from '@/utils/timerUtils';

interface ExpandedTimerViewProps {
  taskName: string;
  timeLeft: number;
  isActive: boolean;
  onPauseResume: () => void;
  onOpenFullTimer: () => void;
}

export const ExpandedTimerView: React.FC<ExpandedTimerViewProps> = ({
  taskName,
  timeLeft,
  isActive,
  onPauseResume,
  onOpenFullTimer
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-90">{taskName}</span>
        <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
      </div>
      
      <div className="flex gap-2">
        <button 
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onPauseResume();
          }}
        >
          {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button 
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFullTimer();
          }}
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
