
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface StudyTimerProgressProps {
  progress: number;
}

export const StudyTimerProgress: React.FC<StudyTimerProgressProps> = ({ progress }) => {
  return (
    <Progress value={progress} className="w-full h-2 mb-4" />
  );
};
