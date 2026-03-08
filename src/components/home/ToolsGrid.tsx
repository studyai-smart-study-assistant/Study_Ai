
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, FileText, BookOpen, ClipboardList, Clock, Trophy, Youtube
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { 
    icon: GraduationCap, 
    label: 'AI Teacher', 
    description: 'Ask questions & learn interactively',
    path: '/teacher-chats',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  { 
    icon: FileText, 
    label: 'Notes Generator', 
    description: 'Auto-generate study notes with AI',
    path: '/notes-creator',
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10'
  },
  { 
    icon: BookOpen, 
    label: 'Quiz', 
    description: 'Create quizzes & earn XP',
    path: '/quiz-generator',
    color: 'text-green-500 dark:text-green-400',
    bg: 'bg-green-500/10'
  },
  { 
    icon: ClipboardList, 
    label: 'Homework Helper', 
    description: 'Get instant homework answers',
    path: '/homework-helper',
    color: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10'
  },
  { 
    icon: Clock, 
    label: 'Study Planner', 
    description: 'Plan your study schedule smartly',
    path: '/study-planner',
    color: 'text-pink-500 dark:text-pink-400',
    bg: 'bg-pink-500/10'
  },
  { 
    icon: Trophy, 
    label: 'Leaderboard', 
    description: 'Compete & track your progress',
    path: '/leaderboard',
    color: 'text-yellow-500 dark:text-yellow-400',
    bg: 'bg-yellow-500/10'
  },
];

const ToolsGrid: React.FC = () => {
  return (
    <div className="px-4 py-8">
      <h2 className="text-lg font-semibold text-foreground text-center mb-6">
        AI-Powered Study Tools
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path}>
            <div className={cn(
              "group relative flex flex-col items-center text-center p-5 rounded-2xl border border-border bg-card",
              "hover:shadow-elegant hover:border-primary/30 hover:-translate-y-0.5",
              "transition-all duration-200 cursor-pointer"
            )}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", tool.bg)}>
                <tool.icon className={cn("w-6 h-6", tool.color)} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{tool.label}</h3>
              <p className="text-xs text-muted-foreground leading-tight">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ToolsGrid;
