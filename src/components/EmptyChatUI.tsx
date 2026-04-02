
import React, { useState, useEffect, useRef } from 'react';
import SuggestionButton from './SuggestionButton';
import { MessageSquare, FileText, ClipboardList, Brain, Bot, BookOpen, Clock, Award, ArrowDown } from 'lucide-react';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { useAuth } from '@/hooks/useAuth';
import StudyTimer from './study/StudyTimer';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EmptyChatUIProps {
  onStartChat: (message: string) => void;
}

const EmptyChatUI: React.FC<EmptyChatUIProps> = ({ onStartChat }) => {
  const greeting = getTimeBasedGreeting();
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || '';
  const navigate = useNavigate();
  const [showTimer, setShowTimer] = useState(false);
  const [showScrollGuide, setShowScrollGuide] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const initialGuideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Initially show the guide, then hide it after a delay
    initialGuideTimeoutRef.current = setTimeout(() => {
      setShowScrollGuide(false);
    }, 7000); // Keep it on screen for 7 seconds

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 30) {
        setHasScrolled(true);
        // If the initial timeout is still pending, clear it
        if (initialGuideTimeoutRef.current) {
          clearTimeout(initialGuideTimeoutRef.current);
        }
        setShowScrollGuide(false);
      } else if (hasScrolled && scrollPosition < 30) {
        // If user has scrolled before and is now back at the top
        setShowScrollGuide(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (initialGuideTimeoutRef.current) {
        clearTimeout(initialGuideTimeoutRef.current);
      }
    };
  }, [hasScrolled]);

  const handleStudySessionComplete = () => {
    toast.success("Great job completing your study session!");
  };

  const studentExamples = [
    { icon: <MessageSquare size={16} />, text: "Explain photosynthesis for class 10" },
    { icon: <FileText size={16} />, text: "Generate SSC polity notes" },
    { icon: <ClipboardList size={16} />, text: "Create 10 MCQs on Indian geography" },
    { icon: <Brain size={16} />, text: "Explain Newton's laws simply" },
  ];

  const features = [
    { icon: <Bot/>, name: 'AI Teacher', path: '/teacher-chats', className: 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700', iconClassName: 'text-purple-600 dark:text-purple-400' },
    { icon: <FileText/>, name: 'Generate Notes', path: '/notes-creator', className: 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700', iconClassName: 'text-green-600 dark:text-green-400' },
    { icon: <BookOpen/>, name: 'Quiz Generator', path: '/quiz-generator', className: 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700', iconClassName: 'text-blue-600 dark:text-blue-400' },
    { icon: <Clock/>, name: 'Study Planner', path: '/study-planner', className: 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700', iconClassName: 'text-red-600 dark:text-red-400' },
    { icon: <Award/>, name: 'Leaderboard', path: '/leaderboard', className: 'bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700', iconClassName: 'text-yellow-600 dark:text-yellow-400' },
  ];

  return (
    <div className="h-full overflow-auto pb-12">
      <div className="flex flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-medium text-gray-800 dark:text-gray-200 mb-2">
            {greeting}{displayName ? `, ${displayName}` : ''}
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-400">
            How can Study AI assist you today?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
          <div className="col-span-1 md:col-span-2 mb-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Examples</h2>
              {!showTimer && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowTimer(true)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Study Timer
                </Button>
              )}
            </div>
          </div>
          
          {showTimer ? (
            <div className="col-span-1 md:col-span-2 mb-4">
              <StudyTimer onComplete={handleStudySessionComplete} />
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowTimer(false)}
                className="mt-2 text-purple-600 dark:text-purple-400"
              >
                Hide Timer
              </Button>
            </div>
          ) : (
            <>
              {studentExamples.map((example, index) => (
                <SuggestionButton 
                  key={index}
                  icon={example.icon}
                  label={example.text}
                  onClick={() => onStartChat(example.text)}
                />
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full max-w-3xl px-4 mt-8">
          {features.map((feature, index) => (
            <Button 
                key={index}
                variant="outline" 
                className={cn(
                    "flex flex-col items-center justify-start text-center gap-2 p-3 h-28 w-full border-2 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md",
                    feature.className
                )}
                onClick={() => navigate(feature.path)}
            >
                {React.cloneElement(feature.icon, { className: `h-6 w-6 ${feature.iconClassName} mb-1` })}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">{feature.name}</span>
            </Button>
          ))}
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 max-w-md bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mt-8">
          Study AI can make mistakes. Consider checking important information.
        </div>
      </div>

      {/* --- Floating Scroll Guide --- */}
      <AnimatePresence>
        {showScrollGuide && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed bottom-24 right-4 md:right-8 z-50 p-2 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">Scroll</span>
                    <ArrowDown className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmptyChatUI;
