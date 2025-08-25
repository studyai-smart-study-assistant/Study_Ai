
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Clock, TimerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface StudyTimerFloatingWidgetProps {
  isActive?: boolean;
  timeLeft?: number; // in seconds
  taskName?: string;
  onPauseResume?: () => void;
  onOpenFullTimer?: () => void;
}

const StudyTimerFloatingWidget: React.FC<StudyTimerFloatingWidgetProps> = ({
  isActive = false,
  timeLeft = 0,
  taskName = "Study Session",
  onPauseResume,
  onOpenFullTimer
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we have an active study session
  const [hasActiveSession, setHasActiveSession] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      const activeSession = localStorage.getItem(`${currentUser.uid}_active_study_session`);
      setHasActiveSession(activeSession === 'true');
    }
  }, [currentUser, isActive]);

  if (!hasActiveSession && !isActive) return null;

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOpenTimer = () => {
    if (onOpenFullTimer) {
      onOpenFullTimer();
    } else {
      navigate("/student-activities", { state: { tab: "timer" } });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg cursor-pointer 
                      ${isExpanded ? 'px-4 py-3' : 'p-3'}`}
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-medium opacity-90">{taskName}</span>
                <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPauseResume) onPauseResume();
                  }}
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button 
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTimer();
                  }}
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Clock className="h-6 w-6" />
              {isActive && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudyTimerFloatingWidget;
