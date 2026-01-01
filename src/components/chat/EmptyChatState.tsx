
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, FileText, HelpCircle, BookOpen,
  GraduationCap, Trophy, Zap, Brain, Flame, Target, Lightbulb, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { supabase } from '@/integrations/supabase/client';

interface EmptyChatStateProps {
  onSendMessage: (message: string) => void;
}

const EmptyChatState: React.FC<EmptyChatStateProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const greeting = getTimeBasedGreeting();
  const displayName = currentUser?.displayName?.split(' ')[0] || '';
  
  const [stats, setStats] = useState({ credits: 0, streak: 0, xp: 0, level: 1 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.uid) return;
      try {
        const { data } = await supabase.functions.invoke('points-balance', {
          body: { userId: currentUser.uid }
        });
        if (data) {
          setStats({ credits: data.credits || 0, streak: data.streak || 0, xp: data.xp || 0, level: data.level || 1 });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [currentUser?.uid]);

  const quickPrompts = [
    { icon: Calculator, text: 'Math Problem solve करो', prompt: 'मुझे इस math problem को solve करके समझाओ:', gradient: 'from-blue-500 to-cyan-500' },
    { icon: BookOpen, text: 'Topic explain करो', prompt: 'मुझे इस topic को आसान भाषा में समझाओ:', gradient: 'from-purple-500 to-pink-500' },
    { icon: FileText, text: 'Notes बनाकर दो', prompt: 'मुझे इस विषय पर notes बनाकर दो:', gradient: 'from-amber-500 to-orange-500' },
    { icon: HelpCircle, text: 'Homework help करो', prompt: 'मेरे homework में मदद करो:', gradient: 'from-emerald-500 to-teal-500' }
  ];

  const studyTools = [
    { icon: GraduationCap, label: 'Activities', path: '/student-activities', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { icon: Zap, label: 'Credits', path: '/points-wallet', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { icon: Brain, label: 'Teacher', path: '/teacher-chats', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' }
  ];

  return (
    <motion.div 
      className="flex flex-col items-center justify-start min-h-full px-4 py-6 pb-32 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-2 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse-soft" />
            <span className="text-xs font-medium text-primary">{greeting}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {displayName ? (
              <><span className="text-foreground">नमस्ते, </span><span className="text-gradient">{displayName}!</span></>
            ) : (
              <span className="text-gradient">Study AI में स्वागत है!</span>
            )}
          </h1>
          <p className="text-muted-foreground">Homework, Exam Prep, या कोई भी सवाल पूछें!</p>
        </div>

        {/* Stats Row */}
        {currentUser && (
          <div className="grid grid-cols-4 gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {[
              { icon: Flame, value: stats.streak, label: 'Streak', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
              { icon: Zap, value: stats.credits, label: 'Credits', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
              { icon: Target, value: stats.xp, label: 'XP', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { icon: Trophy, value: stats.level, label: 'Level', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' }
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center border border-border/50`}>
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Prompts */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Start</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((item, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(item.prompt)}
                className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-study transition-all duration-300 text-left"
              >
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${item.gradient} shadow-md group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Study Tools */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Study Tools</h3>
          <div className="grid grid-cols-4 gap-2">
            {studyTools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => navigate(tool.path)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl ${tool.bg} border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105`}
              >
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
                <span className="text-xs font-medium text-foreground">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="glass-card p-3 border-l-4 border-primary flex items-start gap-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Pro Tip:</span> Hindi या English में पूछें। Images भी upload कर सकते हैं!
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default EmptyChatState;
