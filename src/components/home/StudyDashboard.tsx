
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Zap, 
  Target, 
  BookOpen, 
  Clock, 
  Trophy,
  Sparkles,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTimeBasedGreeting } from '@/utils/timeUtils';

interface StudyDashboardProps {
  credits?: number;
  streak?: number;
  xp?: number;
  level?: number;
}

const StudyDashboard: React.FC<StudyDashboardProps> = ({
  credits = 100,
  streak = 0,
  xp = 0,
  level = 1
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const greeting = getTimeBasedGreeting();
  const displayName = currentUser?.displayName?.split(' ')[0] || 'Student';

  const stats = [
    {
      icon: Flame,
      label: 'Streak',
      value: streak,
      suffix: 'दिन',
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: Zap,
      label: 'Credits',
      value: credits,
      suffix: '',
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
      textColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      icon: TrendingUp,
      label: 'XP',
      value: xp,
      suffix: '',
      gradient: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: Trophy,
      label: 'Level',
      value: level,
      suffix: '',
      gradient: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50 dark:bg-violet-950/30',
      textColor: 'text-violet-600 dark:text-violet-400'
    }
  ];

  const quickActions = [
    {
      icon: BookOpen,
      label: 'AI Teacher',
      description: 'कुछ भी पूछें',
      onClick: () => navigate('/teacher-chats'),
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Target,
      label: 'Quiz लें',
      description: 'Practice करें',
      onClick: () => navigate('/student-activities'),
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Clock,
      label: 'Study Timer',
      description: 'Focus करें',
      onClick: () => navigate('/student-activities'),
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: Calendar,
      label: 'Study Plan',
      description: 'Plan बनाएं',
      onClick: () => navigate('/student-activities'),
      gradient: 'from-teal-500 to-cyan-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };

  return (
    <motion.div 
      className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Greeting Section */}
      <motion.div variants={itemVariants} className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
          <span className="text-sm font-medium text-muted-foreground">{greeting}</span>
          <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
        </div>
        <h1 className="text-display-sm md:text-display-md font-extrabold">
          <span className="text-foreground">नमस्ते, </span>
          <span className="text-gradient">{displayName}!</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          आज क्या पढ़ना है? Study AI आपकी मदद के लिए तैयार है।
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className={`study-card p-4 ${stat.bgColor} border-0`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${stat.textColor}`}>
                  {stat.value}
                  {stat.suffix && <span className="text-sm ml-1">{stat.suffix}</span>}
                </div>
                <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Quick Study Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={action.onClick}
              className="quick-action group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`quick-action-icon bg-gradient-to-br ${action.gradient}`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Study Tip */}
      <motion.div 
        variants={itemVariants}
        className="glass-card p-4 border-l-4 border-primary"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">💡 Study Tip</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Pomodoro Technique का उपयोग करें - 25 मिनट पढ़ाई, 5 मिनट break। यह focus और productivity बढ़ाता है!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudyDashboard;
