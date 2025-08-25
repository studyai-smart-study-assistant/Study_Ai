
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw, BookOpen, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizResult } from './types';

interface QuizResultsViewProps {
  result: QuizResult;
  onReset: () => void;
  onReviewAnswers: () => void;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({
  result,
  onReset,
  onReviewAnswers
}) => {
  const { language } = useLanguage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 space-y-6">
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl sm:text-2xl text-purple-800 dark:text-purple-300">
            {language === 'hi' ? 'क्विज़ परिणाम' : 'Quiz Results'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-600" />
              <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{percentage}%</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{language === 'hi' ? 'स्कोर' : 'Score'}</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{result.score}/{result.totalQuestions}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{language === 'hi' ? 'सही उत्तर' : 'Correct'}</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">{formatTime(result.timeTaken)}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{language === 'hi' ? 'समय लगा' : 'Time Taken'}</div>
            </div>
          </div>

          {/* XP Earned Display */}
          {result.xpEarned && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center gap-3">
                <Award className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-300">
                    {language === 'hi' ? 'बधाई हो! आपने' : 'Congratulations! You earned'} +{result.xpEarned} XP {language === 'hi' ? 'अर्जित किए!' : '!'}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    🏆 {language === 'hi' ? 'आपकी लीडरबोर्ड रैंकिंग में सुधार हुआ!' : 'Your leaderboard ranking improved!'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.wrongAnswers.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                {language === 'hi' ? 'गलत उत्तर' : 'Wrong Answers'}
              </h3>
              {result.wrongAnswers.map((wrong, index) => (
                <div key={index} className="p-3 sm:p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="font-medium mb-2 text-sm sm:text-base">{wrong.question}</p>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                    <div className="text-red-600 dark:text-red-400">
                      <span className="font-medium">{language === 'hi' ? 'आपका उत्तर:' : 'Your Answer:'}</span> {wrong.userAnswer}
                    </div>
                    <div className="text-green-600 dark:text-green-400">
                      <span className="font-medium">{language === 'hi' ? 'सही उत्तर:' : 'Correct Answer:'}</span> {wrong.correctAnswer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {/* Review Answers Button */}
            <Button onClick={onReviewAnswers} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <BookOpen className="h-4 w-4 mr-2" />
              {language === 'hi' ? 'उत्तरों की विस्तृत समीक्षा करें' : 'Review Answers in Detail'}
            </Button>
            
            {/* Start New Quiz Button */}
            <Button onClick={onReset} className="w-full" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              {language === 'hi' ? 'नई क्विज़ शुरू करें' : 'Start New Quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
