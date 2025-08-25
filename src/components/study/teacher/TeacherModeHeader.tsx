
import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, Users, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const TeacherModeHeader: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4"
    >
      <div className="flex items-center justify-center gap-3">
        <div className="p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl text-white shadow-xl animate-pulse">
          <GraduationCap className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            {t('teacherMode')}
            <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce" />
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
            {language === 'hi' 
              ? 'AI शिक्षक के साथ व्यक्तिगत शिक्षा का अनुभव करें'
              : 'Experience personalized education with AI Teacher'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2"></div>
          {language === 'hi' ? 'लाइव कक्षा' : 'Live Class'}
        </Badge>
        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2">
          <Users className="h-3 w-3 mr-1" />
          {language === 'hi' ? '1-on-1' : '1-on-1'}
        </Badge>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
          <Brain className="h-3 w-3 mr-1" />
          {language === 'hi' ? 'AI पावर्ड' : 'AI Powered'}
        </Badge>
      </div>
    </motion.div>
  );
};

export default TeacherModeHeader;
