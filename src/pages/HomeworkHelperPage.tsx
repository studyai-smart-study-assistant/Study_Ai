
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import HomeworkAssistantWrapper from '@/components/study/HomeworkAssistantWrapper';
import PageMeta from '@/components/seo/PageMeta';

const HomeworkHelperPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title="AI Homework Helper - Instant Answers & Step-by-Step Solutions | StudyAI"
        description="Stuck on a tough problem? Our AI Homework Helper provides instant, step-by-step solutions for math, science, history, and more. Snap a picture or type your question to get unstuck and understand concepts better."
        canonicalPath="/homework-helper"
        keywords="AI homework helper, homework solver, instant answers, math problem solver, science question solver, assignment help, academic assistance, school help"
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
        <h1 className="font-semibold flex-1">Homework Helper</h1>
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto p-4">
        <HomeworkAssistantWrapper />
      </main>
    </div>
  );
};

export default HomeworkHelperPage;
