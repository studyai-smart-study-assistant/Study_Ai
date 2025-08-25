
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeacherMessage {
  id: string;
  content: string;
  isQuestion: boolean;
  awaitingResponse?: boolean;
  timestamp: number;
}

interface LessonProgressIndicatorProps {
  messages: TeacherMessage[];
}

const LessonProgressIndicator: React.FC<LessonProgressIndicatorProps> = ({
  messages
}) => {
  const { language } = useLanguage();

  if (messages.length === 0) return null;

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-md border border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {language === 'hi' ? 'संदेश' : 'Messages'}: {messages.length} | 
          {language === 'hi' ? ' प्रश्न' : ' Questions'}: {messages.filter(m => m.isQuestion).length}
        </span>
      </div>
    </div>
  );
};

export default LessonProgressIndicator;
