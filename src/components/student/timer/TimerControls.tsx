
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  isActive: boolean;
  timerMode: 'study' | 'break';
  onToggle: () => void;
  onReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  timerMode,
  onToggle,
  onReset
}) => {
  return (
    <div className="flex gap-2 mb-4">
      <Button 
        variant="outline"
        size="sm" 
        onClick={onToggle}
        className={`flex items-center gap-1 ${
          timerMode === 'study'
            ? 'border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
            : 'border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30'
        }`}
      >
        {isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
        {isActive ? "पॉज़" : "स्टार्ट"}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onReset}
        className={`flex items-center gap-1 ${
          timerMode === 'study'
            ? 'border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
            : 'border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30'
        }`}
      >
        <RotateCcw className="h-4 w-4" />
        रीसेट
      </Button>
    </div>
  );
};
