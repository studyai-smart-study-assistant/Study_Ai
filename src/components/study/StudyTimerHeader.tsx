
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Check } from 'lucide-react';

interface StudyTimerHeaderProps {
  taskSubject: string;
  taskName: string;
  taskComplete: boolean;
}

export const StudyTimerHeader: React.FC<StudyTimerHeaderProps> = ({
  taskSubject,
  taskName,
  taskComplete
}) => {
  return (
    <CardHeader className="pb-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
          <Clock className="h-5 w-5" />
          <span>{taskSubject}</span>
        </CardTitle>
        {taskComplete && (
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Check className="h-3 w-3" />
            पूरा हुआ
          </span>
        )}
      </div>
    </CardHeader>
  );
};
