
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Question } from './types';

interface QuizQuestionProps {
  question: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  userAnswer: number;
  timeLeft: number;
  onAnswerSelect: (answerIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  currentQuestionIndex,
  totalQuestions,
  userAnswer,
  timeLeft,
  onAnswerSelect,
  onPrevious,
  onNext,
  onSubmit,
  canGoPrevious,
  isLastQuestion
}) => {
  const { language } = useLanguage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
      {/* Mobile-friendly Header */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-semibold">
                {language === 'hi' ? 'प्रश्न' : 'Question'} {currentQuestionIndex + 1}/{totalQuestions}
              </span>
              <div className="flex-1 sm:w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-red-600 justify-center sm:justify-start">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-base sm:text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-friendly Question */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg leading-relaxed">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <RadioGroup 
            value={userAnswer?.toString()} 
            onValueChange={(value) => onAnswerSelect(parseInt(value))}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed">
                  <span className="font-medium mr-2 text-purple-600">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mobile-friendly Navigation */}
      <div className="flex justify-between gap-3">
        <Button 
          onClick={onPrevious}
          disabled={!canGoPrevious}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
        >
          {language === 'hi' ? 'पिछला' : 'Previous'}
        </Button>
        
        <div className="flex gap-2 flex-1 sm:flex-none">
          {isLastQuestion ? (
            <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none" size="sm">
              {language === 'hi' ? 'सबमिट करें' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button onClick={onNext} className="flex-1 sm:flex-none" size="sm">
              {language === 'hi' ? 'अगला' : 'Next'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
