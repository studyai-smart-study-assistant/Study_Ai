
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  greeting: string;
  userName?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ greeting, userName }) => {
  return (
    <div className="text-center py-8 px-4">
      {/* Small greeting */}
      <p className="text-sm text-muted-foreground mb-2">
        {greeting}{userName ? `, ${userName}` : ''} 👋
      </p>

      {/* Main Title */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles className="w-6 h-6 text-primary" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          StudyAI
        </h1>
      </div>
      <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-2">
        Smart AI Learning Assistant
      </p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
        Generate Notes, Quizzes and Study Answers instantly using AI.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/notes-creator">
          <Button size="lg" className="gap-2 rounded-full px-6 shadow-elegant">
            <FileText className="w-4 h-4" />
            Generate Notes
          </Button>
        </Link>
        <Link to="/quiz-generator">
          <Button size="lg" variant="secondary" className="gap-2 rounded-full px-6 border border-border">
            <BookOpen className="w-4 h-4" />
            Create Quiz
          </Button>
        </Link>
        <Link to="/teacher-chats">
          <Button size="lg" variant="outline" className="gap-2 rounded-full px-6">
            <GraduationCap className="w-4 h-4" />
            Start AI Teacher
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
