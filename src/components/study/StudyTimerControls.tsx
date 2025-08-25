
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';

interface StudyTimerControlsProps {
  isActive: boolean;
  taskComplete: boolean;
  timeSpentPercentage: number;
  onToggle: () => void;
  onReset: () => void;
  onComplete: () => void;
}

export const StudyTimerControls: React.FC<StudyTimerControlsProps> = ({
  isActive,
  taskComplete,
  timeSpentPercentage,
  onToggle,
  onReset,
  onComplete
}) => {
  if (taskComplete) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={onReset}
        className="w-full mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
      >
        नया सेशन शुरू करें
      </Button>
    );
  }

  return (
    <div className="flex gap-2 mb-4 w-full">
      <Button 
        variant="outline"
        size="sm" 
        onClick={onToggle}
        className="flex-1 flex items-center gap-1 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30"
      >
        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isActive ? "पॉज़" : "स्टार्ट"}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onReset}
        className="flex-1 flex items-center gap-1 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30"
      >
        <RotateCcw className="h-4 w-4" />
        रिसेट
      </Button>
      
      <Button 
        variant="secondary"
        size="sm"
        onClick={onComplete}
        disabled={isActive || timeSpentPercentage < 50}
        className="flex-1 flex items-center gap-1"
      >
        <Flag className="h-4 w-4" />
        पूरा करें
      </Button>
    </div>
  );
};
