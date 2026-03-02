
import React from 'react';
import { TrendingUp, Users, Brain, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const achievements = [
  {
    icon: TrendingUp,
    title: 'Growing Student AI Platform',
    description: 'Rapidly expanding across Indian schools and colleges',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Trusted by Students',
    description: 'Used by students preparing for board & competitive exams',
    color: 'text-green-500 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Brain,
    title: 'Smart AI Learning Tools',
    description: 'Notes, quizzes and answers powered by advanced AI',
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Interactive AI Teacher',
    description: 'Learn any topic in Hindi & English with AI guidance',
    color: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
];

const AwardsSection: React.FC = () => {
  return (
    <div className="px-4 py-8">
      <h2 className="text-lg font-semibold text-foreground text-center mb-6">
        StudyAI Achievements
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {achievements.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card"
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AwardsSection;
