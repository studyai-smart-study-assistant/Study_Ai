
import React from 'react';
import EmptyChatUI from '../EmptyChatUI';
import AdvancedStudyTools from '../study/AdvancedStudyTools';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, BookOpen, Zap } from 'lucide-react';

interface EmptyChatStateProps {
  onSendMessage: (message: string) => void;
}

const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onSendMessage }) => {
  return (
    <div className="pb-48 px-4 pt-4 overflow-x-hidden">
      <EmptyChatUI 
        onCreateImage={() => onSendMessage("Help me understand quantum physics concepts")}
        onSurpriseMe={() => onSendMessage("Explain machine learning in simple terms")}
        onAnalyzeImages={() => onSendMessage("Give me a study plan for IELTS exam")}
        onSummarizeText={() => onSendMessage("Summarize the key concepts of organic chemistry")}
        onMore={() => {}}
      />
      
      {/* Enhanced Study Tools Section */}
      <motion.div 
        className="my-8 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Study Tools Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h2 className="text-4xl font-bold text-gradient mb-3">
            Study AI Tools
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            शक्तिशाली AI टूल्स के साथ अपने अध्ययन को अगले स्तर पर ले जाएं
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              Advanced • Interactive • Intelligent
            </span>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
        </motion.div>

        {/* Advanced Study Tools */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-800"
        >
          <AdvancedStudyTools onSendMessage={onSendMessage} />
        </motion.div>
      </motion.div>
      
      {/* Getting Started Section */}
      <motion.div 
        className="max-w-4xl mx-auto mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-300">
              Getting Started
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Welcome to Study AI! आप कोई भी अध्ययन संबंधी प्रश्न पूछ सकते हैं, या इनमें से कोई भी कोशिश करें:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>"मेरी अंतिम परीक्षाओं के लिए अध्ययन कार्यक्रम बनाएं"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>"प्रकाश संश्लेषण की प्रक्रिया समझाएं"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>"द्वितीय विश्व युद्ध की मुख्य घटनाएं क्या हैं?"</span>
              </div>
            </div>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span>"इस गणित की समस्या को हल करने में मदद करें"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>"जीव विज्ञान परीक्षा के लिए अभ्यास प्रश्न दें"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>"भौतिकी के न्यूटन के नियम समझाएं"</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmptyChatState;
