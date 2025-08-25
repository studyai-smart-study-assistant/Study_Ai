
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addPointsToUser } from '@/utils/points';
import { toast } from 'sonner';

interface UseStudyTimerProps {
  initialTime: number;
  onComplete?: () => void;
  taskName?: string;
  taskSubject?: string;
}

export const useStudyTimer = ({ 
  initialTime, 
  onComplete, 
  taskName = "Study Session",
  taskSubject = "General Study"
}: UseStudyTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [studySessions, setStudySessions] = useState(0);
  const [taskComplete, setTaskComplete] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setStudySessions(prev => prev + 1);
      setTaskComplete(true);
      
      toast.success("Study Session Complete!");
      
      if (currentUser) {
        addPointsToUser(
          currentUser.uid,
          10,
          'activity',
          `${taskSubject} - ${taskName} अध्ययन पूरा किया`
        );
      }
      
      if (onComplete) onComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, currentUser, onComplete, taskName, taskSubject]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
    setTaskComplete(false);
  };

  const completeTask = () => {
    const timeSpentPercentage = ((initialTime - timeLeft) / initialTime) * 100;
    
    if (currentUser && timeSpentPercentage >= 50) {
      const xpAwarded = timeSpentPercentage >= 90 ? 15 : 7;
      
      addPointsToUser(
        currentUser.uid, 
        xpAwarded,
        'task',
        `${taskSubject} - ${taskName} अध्ययन कार्य पूरा किया`
      );
      
      toast.success(`Task Completed! You've earned ${xpAwarded} XP points.`);
      setTaskComplete(true);
      if (onComplete) onComplete();
    } else if (!currentUser) {
      toast.error("Login Required");
    } else {
      toast.error("Study More Time");
    }
  };

  return {
    timeLeft,
    isActive,
    studySessions,
    taskComplete,
    toggleTimer,
    resetTimer,
    completeTask
  };
};
