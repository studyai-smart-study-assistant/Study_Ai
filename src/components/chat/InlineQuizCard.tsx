import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizData {
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
}

interface InlineQuizCardProps {
  quizData: QuizData;
}

const InlineQuizCard: React.FC<InlineQuizCardProps> = ({ quizData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const question = quizData.questions[currentIndex];
  const total = quizData.questions.length;
  const progress = ((currentIndex + (isAnswered ? 1 : 0)) / total) * 100;

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    setAnswers(prev => [...prev, selectedOption]);
    if (selectedOption === question.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  const getDifficultyBadge = () => {
    const d = quizData.difficulty;
    if (d === 'easy') return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">🟢 Easy</span>;
    if (d === 'hard') return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">🔴 Hard</span>;
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">🟡 Medium</span>;
  };

  const getScoreEmoji = () => {
    const pct = (score / total) * 100;
    if (pct === 100) return '🏆';
    if (pct >= 70) return '👍';
    if (pct >= 50) return '📚';
    return '💪';
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">{getScoreEmoji()}</div>
          <h3 className="text-lg font-bold text-foreground">Quiz Complete!</h3>
          <p className="text-2xl font-bold text-primary">{score}/{total}</p>
          <p className="text-sm text-muted-foreground">{pct}% सही</p>
          <Progress value={pct} className="h-2 mt-2" />
        </div>

        {/* Review */}
        <div className="space-y-2 pt-2">
          {quizData.questions.map((q, i) => {
            const userAns = answers[i];
            const correct = userAns === q.correctAnswer;
            return (
              <div key={q.id} className={cn(
                "p-3 rounded-xl border text-sm",
                correct ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
              )}>
                <div className="flex items-start gap-2">
                  {correct ? <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground line-clamp-2">{q.question}</p>
                    {!correct && (
                      <p className="text-xs text-muted-foreground mt-1">
                        सही उत्तर: <span className="font-medium text-emerald-600 dark:text-emerald-400">{q.options[q.correctAnswer]}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={handleRestart} variant="outline" className="w-full gap-2">
          <RotateCcw className="h-4 w-4" /> फिर से करें
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground truncate">{quizData.title || `Quiz: ${quizData.topic}`}</h3>
          {getDifficultyBadge()}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">प्रश्न {currentIndex + 1}/{total}</span>
          <span className="text-xs text-muted-foreground">Score: {score}</span>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </div>

      {/* Question */}
      <div className="p-4 space-y-3">
        <p className="font-semibold text-foreground leading-relaxed">{question.question}</p>

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let optionStyle = "border-border bg-background hover:bg-muted/50";
            
            if (isAnswered) {
              if (idx === question.correctAnswer) {
                optionStyle = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-400";
              } else if (idx === selectedOption && idx !== question.correctAnswer) {
                optionStyle = "border-red-400 bg-red-50 dark:bg-red-950/30 ring-1 ring-red-400";
              } else {
                optionStyle = "border-border/50 bg-muted/20 opacity-60";
              }
            } else if (idx === selectedOption) {
              optionStyle = "border-primary bg-primary/5 ring-1 ring-primary";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all duration-200",
                  optionStyle
                )}
              >
                <span className={cn(
                  "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border",
                  isAnswered && idx === question.correctAnswer ? "bg-emerald-500 text-white border-emerald-500" :
                  isAnswered && idx === selectedOption ? "bg-red-500 text-white border-red-500" :
                  idx === selectedOption ? "bg-primary text-primary-foreground border-primary" :
                  "bg-muted text-muted-foreground border-border"
                )}>
                  {isAnswered && idx === question.correctAnswer ? <CheckCircle className="h-4 w-4" /> :
                   isAnswered && idx === selectedOption ? <XCircle className="h-4 w-4" /> :
                   letter}
                </span>
                <span className="text-sm text-foreground pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && question.explanation && (
          <div className={cn(
            "p-3 rounded-xl text-sm",
            selectedOption === question.correctAnswer
              ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
              : "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
          )}>
            <p className="font-medium text-foreground mb-1">
              {selectedOption === question.correctAnswer ? '✅ सही उत्तर!' : '❌ गलत उत्तर'}
            </p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!isAnswered ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="flex-1"
            >
              उत्तर जमा करें
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1 gap-2">
              {currentIndex < total - 1 ? (
                <>अगला <ChevronRight className="h-4 w-4" /></>
              ) : (
                <>रिज़ल्ट देखें <Trophy className="h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InlineQuizCard;