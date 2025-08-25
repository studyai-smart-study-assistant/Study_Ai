
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface InteractiveTeacherTimerProps {
  startTime: number;
  estimatedDuration?: number; // in minutes
}

const InteractiveTeacherTimer: React.FC<InteractiveTeacherTimerProps> = ({ 
  startTime, 
  estimatedDuration = 30 
}) => {
  const { language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getElapsedTime = () => {
    const elapsed = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return { minutes, seconds };
  };

  const { minutes, seconds } = getElapsedTime();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40"
    >
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-purple-200 dark:border-purple-700 shadow-md">
        <CardContent className="p-3">
          <div className="flex items-center gap-4 text-xs">
            {/* Session Duration */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Timer className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'hi' ? 'चल रहा है' : 'Running'}
                </span>
              </div>
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Estimated Duration */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'hi' ? 'अनुमानित' : 'Estimated'}
                </span>
              </div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                {estimatedDuration} {language === 'hi' ? 'मिनट' : 'min'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InteractiveTeacherTimer;
