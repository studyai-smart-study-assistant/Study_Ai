
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  timeElapsed: number;
  correctAnswers: number;
  wrongAnswers: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestion,
  totalQuestions,
  timeElapsed,
  correctAnswers,
  wrongAnswers
}) => {
  const { language } = useLanguage();
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const accuracy = currentQuestion > 0 ? (correctAnswers / currentQuestion) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
          {language === 'en' ? 'Quiz Progress' : 'क्विज प्रगति'}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          {formatTime(timeElapsed)}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>{language === 'en' ? 'Progress' : 'प्रगति'}</span>
            <span>{currentQuestion}/{totalQuestions}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-lg font-bold">{correctAnswers}</span>
            </div>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Correct' : 'सही'}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="text-lg font-bold">{wrongAnswers}</span>
            </div>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Wrong' : 'गलत'}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-lg font-bold">{Math.round(accuracy)}%</span>
            </div>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Accuracy' : 'सटीकता'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizProgress;
