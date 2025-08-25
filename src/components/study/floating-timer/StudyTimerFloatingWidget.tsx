
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloatingTimer } from '@/hooks/useFloatingTimer';
import { ExpandedTimerView } from './ExpandedTimerView';
import { CollapsedTimerView } from './CollapsedTimerView';

interface StudyTimerFloatingWidgetProps {
  isActive?: boolean;
  timeLeft?: number;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const { hasActiveSession } = useFloatingTimer();

  if (!hasActiveSession && !isActive) return null;

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
            <ExpandedTimerView
              taskName={taskName}
              timeLeft={timeLeft}
              isActive={isActive}
              onPauseResume={onPauseResume || (() => {})}
              onOpenFullTimer={handleOpenTimer}
            />
          ) : (
            <CollapsedTimerView isActive={isActive} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudyTimerFloatingWidget;
