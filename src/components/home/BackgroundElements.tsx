
import React from 'react';
import { motion } from 'framer-motion';

const BackgroundElements: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div 
        className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-900 dark:to-indigo-900 rounded-full opacity-10 blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div 
        className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-indigo-200 to-pink-200 dark:from-indigo-900 dark:to-pink-900 rounded-full opacity-10 blur-3xl"
        animate={{ 
          scale: [1.1, 1, 1.1],
          rotate: [90, 0, 90]
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

export default BackgroundElements;
