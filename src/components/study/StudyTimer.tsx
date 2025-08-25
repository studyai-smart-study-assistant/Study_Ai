
import React from 'react';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { formatTime } from '@/utils/timerUtils';
import { StudyTimerProgress } from './StudyTimerProgress';
import { StudyTimerControls } from './StudyTimerControls';
import { StudyTimerHeader } from './StudyTimerHeader';
import { StudyTimerFooter } from './StudyTimerFooter';
import { Card, CardContent } from "@/components/ui/card";

interface StudyTimerProps {
  onComplete?: () => void;
  taskName?: string;
  taskSubject?: string;
  taskDuration?: number;
  taskId?: string;
}

const StudyTimer: React.FC<StudyTimerProps> = ({
  onComplete,
  taskName = "Study Session",
  taskSubject = "General Study",
  taskDuration = 25,
  taskId
}) => {
  const {
    timeLeft,
    isActive,
    studySessions,
    taskComplete,
    toggleTimer,
    resetTimer,
    completeTask
  } = useStudyTimer({
    initialTime: taskDuration * 60,
    onComplete,
    taskName,
    taskSubject
  });

  const progress = (timeLeft / (taskDuration * 60)) * 100;

  return (
    <Card className="border border-purple-100 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow">
      <StudyTimerHeader 
        taskSubject={taskSubject}
        taskName={taskName}
        taskComplete={taskComplete}
      />
      
      <CardContent className="pt-4">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-4">
            {formatTime(timeLeft)}
          </div>
          
          <StudyTimerProgress progress={progress} />
          
          <StudyTimerControls
            isActive={isActive}
            taskComplete={taskComplete}
            onToggle={toggleTimer}
            onReset={resetTimer}
            onComplete={completeTask}
            timeSpentPercentage={(taskDuration * 60 - timeLeft) / (taskDuration * 60) * 100}
          />
          
          <StudyTimerFooter
            studySessions={studySessions}
            timeLeft={timeLeft}
            totalTime={taskDuration * 60}
            isActive={isActive}
            taskComplete={taskComplete}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyTimer;
