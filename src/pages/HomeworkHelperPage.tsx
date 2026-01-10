
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import HomeworkAssistantWrapper from '@/components/study/HomeworkAssistantWrapper';

const HomeworkHelperPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
