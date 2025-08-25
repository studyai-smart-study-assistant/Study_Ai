
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addPointsToUser } from '@/utils/points';
import { playTimerCompletionSound } from '@/utils/timerUtils';

interface UseStudyTimerStateProps {
  breakTime: number;
}

export const useStudyTimerState = ({ breakTime }: UseStudyTimerStateProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [originalTime, setOriginalTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [studySessions, setStudySessions] = useState(0);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      
      if (soundEnabled) {
        playTimerCompletionSound();
      }
      
      if (timerMode === 'study') {
        setStudySessions(prev => prev + 1);
        setTotalStudyTime(prev => prev + Math.floor(originalTime / 60));
        
        if (currentUser) {
          addPointsToUser(
            currentUser.uid,
            15,
            'activity',
            `${Math.floor(originalTime / 60)} मिनट का अध्ययन सत्र पूरा किया`
          );
        }
        
        setTimerMode('break');
        setTimeLeft(breakTime * 60);
        setOriginalTime(breakTime * 60);
        
        toast.success("अध्ययन सत्र पूरा हुआ! ब्रेक लें।");
      } else {
        setTimerMode('study');
        setTimeLeft(25 * 60);
        setOriginalTime(25 * 60);
        
        toast.success("ब्रेक पूरा हुआ! अगला अध्ययन सत्र शुरू करें।");
      }
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerMode, currentUser, originalTime, soundEnabled, breakTime]);

  return {
    timeLeft,
    setTimeLeft,
    originalTime,
    setOriginalTime,
    isActive,
    setIsActive,
    studySessions,
    setStudySessions,
    timerMode,
    setTimerMode,
    soundEnabled,
    setSoundEnabled,
    totalStudyTime,
    setTotalStudyTime
  };
};
