
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RadioIcon, Play, Clock, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInteractiveTeacher } from '@/hooks/interactive-teacher';
import InteractiveTeacherLesson from '@/components/study/interactive-teacher/InteractiveTeacherLesson';
import InteractiveTeacherHistory from '@/components/study/interactive-teacher/InteractiveTeacherHistory';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const InteractiveTeacher = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  
  const {
    messages,
    currentContext,
    isWaitingForStudent,
    isProcessing,
    startLesson,
    submitStudentResponse,
    resetLesson,
    saveCurrentChat
  } = useInteractiveTeacher();

  // Load lesson data from sessionStorage when component mounts
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      const lessonData = sessionStorage.getItem(`lesson_${sessionId}`);
      if (lessonData) {
        const { prompt, context, messages: savedMessages } = JSON.parse(lessonData);
        if (savedMessages && savedMessages.length > 0) {
          startLesson(prompt, context, savedMessages);
        } else {
          startLesson(prompt, context);
        }
        sessionStorage.removeItem(`lesson_${sessionId}`);
      }
    }
  }, [sessionId, messages.length, startLesson]);

  // Save chat when user leaves or when lesson ends
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        saveCurrentChat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (messages.length > 0) {
        saveCurrentChat();
      }
    };
  }, [messages.length, saveCurrentChat]);

  const handleGoBack = async () => {
    if (messages.length > 0) {
      await saveCurrentChat();
    }
    navigate(-1);
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      await saveCurrentChat();
    }
    resetLesson();
    navigate('/');
  };

  const handleSubmitAnswer = (answer: string) => {
    submitStudentResponse(answer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* Responsive Header with Mobile Optimization */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-indigo-200/50 dark:border-indigo-800/50 shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left Section - Mobile Optimized */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={handleGoBack}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-xl transition-all duration-200 px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{language === 'hi' ? 'वापस' : 'Back'}</span>
              </Button>
            </div>

            {/* Center - Live Indicator - Mobile Responsive */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl ${
                isMobile ? 'text-sm' : ''
              }`}
            >
              <div className="relative">
                <div className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-white rounded-full animate-pulse`}></div>
                <div className={`absolute inset-0 ${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-white rounded-full animate-ping opacity-30`}></div>
              </div>
              <Sparkles className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white animate-pulse`} />
              <span className={`text-white font-bold tracking-wide ${isMobile ? 'text-sm' : 'text-lg'}`}>
                {language === 'hi' ? 'Live Teaching' : 'Live Teaching'}
              </span>
            </motion.div>

            {/* Right Section - Mobile Responsive */}
            <div className="flex items-center gap-1 sm:gap-3">
              {isWaitingForStudent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg sm:rounded-xl text-white font-medium shadow-lg ${
                    isMobile ? 'text-xs' : ''
                  }`}
                >
                  <Clock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
                  <span className="hidden sm:inline">{language === 'hi' ? 'प्रतीक्षा में' : 'Waiting'}</span>
                </motion.div>
              )}
              
              <InteractiveTeacherHistory />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 px-2 sm:px-3"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{language === 'hi' ? 'नया चैट' : 'New Chat'}</span>
              </Button>
            </div>
          </div>

          {/* Subject Info Bar - Mobile Responsive */}
          {currentContext?.subject && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 sm:mt-4 flex items-center justify-center"
            >
              <div className={`px-3 sm:px-6 py-1 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full border border-blue-200 dark:border-blue-700 shadow-sm ${
                isMobile ? 'max-w-[90%]' : ''
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className={`text-blue-700 dark:text-blue-300 font-semibold ${isMobile ? 'text-sm truncate' : ''}`}>
                    {currentContext.subject}
                  </span>
                  {currentContext.chapter && !isMobile && (
                    <>
                      <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-600 dark:text-blue-400 text-sm">
                        {currentContext.chapter}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main Content - Mobile Responsive */}
      <div className="relative">
        <div className={`mx-auto px-3 sm:px-4 py-4 sm:py-8 ${isMobile ? 'max-w-full' : 'max-w-5xl'}`}>
          <InteractiveTeacherLesson
            messages={messages}
            currentContext={currentContext}
            isWaitingForStudent={isWaitingForStudent}
            isProcessing={isProcessing}
            onResetLesson={resetLesson}
            onShowQuestionDialog={() => {}}
            onSubmitAnswer={handleSubmitAnswer}
          />
        </div>

        {/* Background Decorations - Hide on mobile for performance */}
        {!isMobile && (
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveTeacher;
