
import React from 'react';
import { Award, Clock } from 'lucide-react';
import { formatTime } from '@/utils/timerUtils';

interface TimerStatsProps {
  studySessions: number;
  totalStudyTime: number;
}

export const TimerStats: React.FC<TimerStatsProps> = ({
  studySessions,
  totalStudyTime
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 text-sm">
      <div className="flex items-center text-purple-600 dark:text-purple-400 gap-1">
        <Award className="h-4 w-4" />
        <span>{studySessions} {studySessions === 1 ? 'सत्र' : 'सत्र'} पूरा</span>
      </div>
      
      {totalStudyTime > 0 && (
        <div className="flex items-center text-indigo-600 dark:text-indigo-400 gap-1">
          <Clock className="h-4 w-4" />
          <span>कुल: {formatTime(totalStudyTime)}</span>
        </div>
      )}
    </div>
  );
};
