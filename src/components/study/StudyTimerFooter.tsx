
import React from 'react';
import { Award, Clock } from 'lucide-react';
import { CardFooter } from "@/components/ui/card";

interface StudyTimerFooterProps {
  studySessions: number;
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  taskComplete: boolean;
}

export const StudyTimerFooter: React.FC<StudyTimerFooterProps> = ({
  studySessions,
  timeLeft,
  totalTime,
  isActive,
  taskComplete
}) => {
  const timeSpentPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <>
      {studySessions > 0 && (
        <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 gap-1 animate-fade-in">
          <Award className="h-4 w-4" />
          <span>{studySessions} {studySessions === 1 ? 'सेशन' : 'सेशन'} पूरे हुए!</span>
        </div>
      )}
      
      {!isActive && !taskComplete && timeSpentPercentage > 0 && (
        <CardFooter className="pt-0 pb-4 px-6">
          <p className="text-xs text-center text-purple-600 dark:text-purple-400 w-full">
            {Math.round(timeSpentPercentage)}% पूरा हुआ • कम से कम 50% समय अध्ययन करें
          </p>
        </CardFooter>
      )}
    </>
  );
};
