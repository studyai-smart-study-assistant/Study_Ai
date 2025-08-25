
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, BookOpen, Award, Clock, Timer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ReviewAnswer } from './types';

interface QuizAnswerReviewProps {
  reviewAnswers: ReviewAnswer[];
  onBackToResults: () => void;
  xpEarned: number;
}

export const QuizAnswerReview: React.FC<QuizAnswerReviewProps> = ({
  reviewAnswers,
  onBackToResults,
  xpEarned
}) => {
  const { language } = useLanguage();

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}${language === 'hi' ? ' सेकंड' : 's'}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}${language === 'hi' ? ' मिनट' : 'm'}`;
  };

  const getTimeAnalysis = (timeSpent: number) => {
    if (timeSpent < 30) {
      return {
        color: 'text-green-600 dark:text-green-400',
        text: language === 'hi' ? 'तेज़' : 'Fast'
      };
    } else if (timeSpent < 60) {
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        text: language === 'hi' ? 'सामान्य' : 'Normal'
      };
    } else {
      return {
        color: 'text-red-600 dark:text-red-400',
        text: language === 'hi' ? 'धीमा' : 'Slow'
      };
    }
  };

  const averageTime = reviewAnswers.reduce((sum, review) => sum + (review.timeSpent || 0), 0) / reviewAnswers.length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl text-purple-800 dark:text-purple-300 flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" />
            {language === 'hi' ? 'उत्तरों की विस्तृत समीक्षा' : 'Detailed Answer Review'}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <Award className="h-5 w-5" />
            <span className="text-lg font-semibold">
              +{xpEarned} XP {language === 'hi' ? 'अर्जित किए!' : 'Earned!'}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Time Analysis Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Timer className="h-5 w-5" />
            {language === 'hi' ? 'समय विश्लेषण' : 'Time Analysis'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {formatTime(Math.floor(averageTime))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'hi' ? 'औसत समय प्रति प्रश्न' : 'Average per Question'}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">
                {reviewAnswers.filter(r => (r.timeSpent || 0) < 30).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'hi' ? 'तेज़ उत्तर' : 'Fast Answers'}
              </div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
                {reviewAnswers.filter(r => (r.timeSpent || 0) > 60).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'hi' ? 'धीमे उत्तर' : 'Slow Answers'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <div className="space-y-6">
        {reviewAnswers.map((review, index) => {
          const timeAnalysis = getTimeAnalysis(review.timeSpent || 0);
          
          return (
            <Card key={review.questionIndex} className={`border-l-4 ${review.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {review.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {language === 'hi' ? 'प्रश्न' : 'Question'} {index + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        review.isCorrect 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {review.isCorrect 
                          ? (language === 'hi' ? 'सही' : 'Correct')
                          : (language === 'hi' ? 'गलत' : 'Wrong')
                        }
                      </span>
                      {/* Time spent on this question */}
                      <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 ${timeAnalysis.color}`}>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatTime(review.timeSpent || 0)} ({timeAnalysis.text})
                      </span>
                    </div>
                    <CardTitle className="text-base sm:text-lg">{review.question}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                {/* Options */}
                <div className="space-y-2">
                  {review.options.map((option, optionIndex) => {
                    const isUserAnswer = optionIndex === review.userAnswer;
                    const isCorrectAnswer = optionIndex === review.correctAnswer;
                    
                    let optionClass = 'p-3 border rounded-lg';
                    
                    if (isCorrectAnswer) {
                      optionClass += ' bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700';
                    } else if (isUserAnswer && !review.isCorrect) {
                      optionClass += ' bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700';
                    } else {
                      optionClass += ' bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
                    }
                    
                    return (
                      <div key={optionIndex} className={optionClass}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-purple-600 dark:text-purple-400">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="flex-1">{option}</span>
                          <div className="flex items-center gap-2">
                            {isCorrectAnswer && (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                {language === 'hi' ? 'सही उत्तर' : 'Correct'}
                              </span>
                            )}
                            {isUserAnswer && !review.isCorrect && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                                {language === 'hi' ? 'आपका उत्तर' : 'Your Answer'}
                              </span>
                            )}
                            {isUserAnswer && review.isCorrect && (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                {language === 'hi' ? 'आपका सही उत्तर' : 'Your Correct Answer'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Explanation */}
                {review.explanation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {language === 'hi' ? 'विस्तृत स्पष्टीकरण:' : 'Detailed Explanation:'}
                    </h4>
                    <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
                      {review.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onBackToResults} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === 'hi' ? 'परिणाम पर वापस जाएं' : 'Back to Results'}
        </Button>
      </div>
    </div>
  );
};
