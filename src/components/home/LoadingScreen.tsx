
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Star } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-24 h-24 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-20 blur-xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <motion.div 
        className="flex flex-col items-center gap-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-2xl relative"
          animate={{ 
            rotateY: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles className="animate-pulse" size={32} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 opacity-30 blur-lg animate-pulse" />
        </motion.div>
        
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="text-2xl font-bold text-gradient">Study AI</div>
          <div className="text-purple-600 dark:text-purple-300 font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            लोड हो रहा है...
            <Star className="w-4 h-4 animate-spin" />
          </div>
        </motion.div>
        
        <motion.div 
          className="flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
