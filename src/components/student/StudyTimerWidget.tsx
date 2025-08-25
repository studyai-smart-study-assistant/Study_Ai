import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useStudyTimerState } from '@/hooks/useStudyTimerState';
import { TimerControls } from './timer/TimerControls';
import { TimerStats } from './timer/TimerStats';
import { TimerSettings } from './timer/TimerSettings';
import { formatTime } from '@/utils/timerUtils';

interface StudyTimerWidgetProps {
  currentUser: any;
}

const StudyTimerWidget: React.FC<StudyTimerWidgetProps> = ({ currentUser }) => {
  const [breakTime, setBreakTime] = useState(5);
  const {
    timeLeft,
    setTimeLeft,
    originalTime,
    setOriginalTime,
    isActive,
    setIsActive,
    studySessions,
    timerMode,
    setTimerMode,
    soundEnabled,
    setSoundEnabled,
    totalStudyTime,
  } = useStudyTimerState({ breakTime });
  
  // Load saved settings
  useEffect(() => {
    if (currentUser) {
      const savedSoundSetting = localStorage.getItem(`${currentUser.uid}_timer_sound`);
      const savedBreakTime = localStorage.getItem(`${currentUser.uid}_break_time`);
      
      if (savedSoundSetting !== null) {
        setSoundEnabled(savedSoundSetting === 'true');
      }
      
      if (savedBreakTime) {
        setBreakTime(parseInt(savedBreakTime));
      }
    }
  }, [currentUser, setSoundEnabled]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(originalTime);
  };
  
  const changeTimerDuration = (minutes: number) => {
    if (!isActive) {
      const newTime = minutes * 60;
      setTimeLeft(newTime);
      setOriginalTime(newTime);
      toast.success(`टाइमर ${minutes} मिनट पर सेट किया गया`);
    }
  };
  
  const changeBreakDuration = (minutes: number) => {
    setBreakTime(minutes);
    localStorage.setItem(`${currentUser.uid}_break_time`, minutes.toString());
    toast.success(`ब्रेक समय ${minutes} मिनट पर सेट किया गया`);
  };
  
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    localStorage.setItem(`${currentUser.uid}_timer_sound`, (!soundEnabled).toString());
    toast.success(soundEnabled ? 'ध्वनि बंद की गई' : 'ध्वनि चालू की गई');
  };

  const progress = (timeLeft / originalTime) * 100;

  return (
    <Card className="border border-purple-100 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className={`pb-2 ${
        timerMode === 'study' 
          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40' 
          : 'bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/40 dark:to-teal-900/40'
      }`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
            <Clock className="h-5 w-5" />
            <span>{timerMode === 'study' ? 'अध्ययन टाइमर' : 'ब्रेक टाइमर'}</span>
          </CardTitle>
          
          <TimerSettings
            soundEnabled={soundEnabled}
            onSoundToggle={toggleSound}
            onTimerDurationChange={changeTimerDuration}
            onBreakDurationChange={changeBreakDuration}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-center">
          <div className={`text-4xl font-bold mb-4 ${
            timerMode === 'study' 
              ? 'text-purple-700 dark:text-purple-300' 
              : 'text-green-700 dark:text-green-300'
          }`}>
            {formatTime(timeLeft)}
          </div>
          
          <Progress value={progress} className={`w-full h-2 mb-4 ${
            timerMode === 'study' 
              ? 'bg-purple-100 dark:bg-purple-900' 
              : 'bg-green-100 dark:bg-green-900'
          }`} />
          
          <TimerControls
            isActive={isActive}
            timerMode={timerMode}
            onToggle={toggleTimer}
            onReset={resetTimer}
          />
          
          <TimerStats
            studySessions={studySessions}
            totalStudyTime={totalStudyTime}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyTimerWidget;
