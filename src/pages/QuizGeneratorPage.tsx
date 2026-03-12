
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import QuizGeneratorWrapper from '@/components/study/QuizGeneratorWrapper';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import MonetagInterstitial from '@/components/ads/MonetagInterstitial';
import PageMeta from '@/components/seo/PageMeta';

const QuizGenerator = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="Free AI Quiz Generator - Create Custom Quizzes & Tests Instantly | StudyAI"
        description="Create practice quizzes and tests on any subject for free with our AI Quiz Generator. Perfect for students preparing for exams like SSC, UPSC, JEE, NEET, and board exams. Generate MCQs, fill-in-the-blanks, and more to test your knowledge."
        canonicalPath="/quiz-generator"
        keywords="AI quiz generator, free quiz maker, test generator, custom quiz creator, online quiz tool, MCQ generator, exam preparation, practice tests, student quiz tool"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold flex-1">Quiz Generator</h1>
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Content */}
      <MonetagInterstitial page="quiz" />
      <main className="container max-w-4xl mx-auto p-4">
        <AdsterraBanner page="quiz" />
        <QuizGeneratorWrapper />
      </main>
    </div>
  );
};

export default QuizGenerator;
