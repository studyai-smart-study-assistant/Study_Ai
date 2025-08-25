
import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, MessageSquare, Sparkles, Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

const LoadingTeacher: React.FC = () => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 ${
        isMobile ? 'min-h-[50vh] px-4' : 'min-h-[60vh]'
      }`}
    >
      {/* Animated Teacher Icon */}
      <div className="relative">
        <motion.div 
          className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl`}
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, -2, 2, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <GraduationCap className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-white`} />
        </motion.div>
        
        {/* Floating Icons */}
        <motion.div 
          className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center`}
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Sparkles className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
        </motion.div>

        <motion.div
          className={`absolute -bottom-2 -left-2 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center`}
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-white`} />
        </motion.div>
      </div>
      
      {/* Loading Text */}
      <div className="space-y-3 sm:space-y-4">
        <motion.h1 
          className={`font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ${
            isMobile ? 'text-2xl' : 'text-3xl'
          }`}
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {language === 'hi' ? 'AI Teacher तैयार हो रहा है...' : 'AI Teacher Getting Ready...'}
        </motion.h1>
        
        <motion.p 
          className={`text-gray-600 dark:text-gray-300 max-w-md ${
            isMobile ? 'text-base px-4' : 'text-lg'
          }`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {language === 'hi' 
            ? 'आपका व्यक्तिगत AI शिक्षक आपके लिए सबसे अच्छा teaching experience तैयार कर रहा है।'
            : 'Your personal AI teacher is preparing the best teaching experience for you.'
          }
        </motion.p>
      </div>

      {/* Loading Dots */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full`}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Progress Indicator */}
      <motion.div 
        className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          animate={{ 
            x: ['-100%', '100%'],
            scaleX: [0.3, 1, 0.3]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default LoadingTeacher;
