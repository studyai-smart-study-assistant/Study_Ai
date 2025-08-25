
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import QuickResponseButtons from './QuickResponseButtons';

interface StudentInputAreaProps {
  onSubmitAnswer: (answer: string) => void;
  isProcessing: boolean;
}

const StudentInputArea: React.FC<StudentInputAreaProps> = ({
  onSubmitAnswer,
  isProcessing
}) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [studentAnswer, setStudentAnswer] = useState('');

  const handleSubmitAnswer = () => {
    if (studentAnswer.trim()) {
      onSubmitAnswer(studentAnswer);
      setStudentAnswer('');
    }
  };

  const handleQuickResponse = (response: string) => {
    onSubmitAnswer(response);
    setStudentAnswer('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from sending message - only allow Send button to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Do nothing - user must click Send button
    }
  };

  return (
    <div className="fixed bottom-3 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t border-indigo-200/50 dark:border-indigo-800/50 shadow-2xl z-50">
      <div className={`mx-auto ${isMobile ? 'max-w-full px-2 py-2' : 'max-w-5xl px-3 py-2'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <QuickResponseButtons onQuickResponse={handleQuickResponse} />
          
          <div className={`mx-auto ${isMobile ? 'w-full' : 'max-w-4xl'}`}>
            <div className="relative bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-indigo-900/30 rounded-lg border border-indigo-200/50 dark:border-indigo-700/50 p-1.5 shadow-md">
              
              <div className={`flex items-center gap-2 ${isMobile ? 'flex-row' : ''}`}>
                <div className="flex-shrink-0">
                  <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} bg-gradient-to-br from-green-400 to-blue-500 rounded-md flex items-center justify-center shadow-md`}>
                    <MessageSquare className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-white`} />
                  </div>
                </div>
                
                <div className="flex-1">
                  <Textarea
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder={language === 'hi' 
                      ? "यहाँ अपना जवाब टाइप करें..." 
                      : "Type your answer here..."}
                    className={`${isMobile ? 'min-h-[40px] max-h-[80px] text-sm py-3 px-4' : 'min-h-[48px] max-h-[100px] text-base py-3 px-4'} bg-white/70 dark:bg-gray-800/70 border-0 focus:ring-1 focus:ring-indigo-400 resize-none rounded-md placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-inner`}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                
                <div className="flex-shrink-0">
                  <Button 
                    onClick={handleSubmitAnswer} 
                    disabled={!studentAnswer.trim() || isProcessing}
                    className={`bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                      isMobile ? 'px-3 py-2 text-sm h-9 min-w-[60px]' : 'px-4 py-2.5 text-sm h-11 min-w-[70px]'
                    }`}
                  >
                    {isProcessing ? (
                      <div className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
                    ) : (
                      <>
                        <Send className={`${isMobile ? 'h-2.5 w-2.5 mr-1' : 'h-3 w-3 mr-1.5'}`} />
                        {language === 'hi' ? 'भेजें' : 'Send'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentInputArea;
