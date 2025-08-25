
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, ThumbsUp, SkipForward, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickResponseButtonsProps {
  onQuickResponse: (response: string) => void;
}

const QuickResponseButtons: React.FC<QuickResponseButtonsProps> = ({
  onQuickResponse
}) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const quickResponses = [
    {
      text: language === 'hi' ? 'नहीं पता' : "Don't know",
      icon: <HelpCircle className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />,
      color: 'bg-orange-100 hover:bg-orange-200 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300'
    },
    {
      text: language === 'hi' ? 'समझ गया' : 'Got it',
      icon: <ThumbsUp className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />,
      color: 'bg-green-100 hover:bg-green-200 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:border-green-700 dark:text-green-300'
    },
    {
      text: language === 'hi' ? 'विस्तार में समझाएं' : 'Explain in detail',
      icon: <BookOpen className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />,
      color: 'bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300'
    }
  ];

  return (
    <div className={`flex flex-wrap gap-0.5 justify-center ${isMobile ? 'px-1' : ''}`}>
      {quickResponses.map((response, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onQuickResponse(response.text)}
          className={`${isMobile ? 'text-xs px-1 py-0.5 h-5' : 'text-xs px-1.5 py-0.5 h-5'} ${response.color} rounded-full flex items-center gap-0.5`}
        >
          {response.icon}
          <span className={`${isMobile ? 'text-xs' : 'text-xs'}`}>{response.text}</span>
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onQuickResponse(language === 'hi' ? 'आगे बढ़ें' : 'Continue')}
        className={`${isMobile ? 'text-xs px-1 py-0.5 h-5' : 'text-xs px-1.5 py-0.5 h-5'} bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300 rounded-full flex items-center gap-0.5`}
      >
        <SkipForward className={`${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />
        <span className={`${isMobile ? 'text-xs' : 'text-xs'}`}>{language === 'hi' ? 'छोड़ें' : 'Skip'}</span>
      </Button>
    </div>
  );
};

export default QuickResponseButtons;
