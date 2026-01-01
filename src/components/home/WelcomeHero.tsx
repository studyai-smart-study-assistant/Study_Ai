
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Brain, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface WelcomeHeroProps {
  onStartChat?: () => void;
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onStartChat }) => {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, label: 'AI Teacher', color: 'text-purple-500' },
    { icon: Target, label: 'Quiz', color: 'text-pink-500' },
    { icon: BookOpen, label: 'Notes', color: 'text-blue-500' },
    { icon: Zap, label: 'Fast Learning', color: 'text-amber-500' }
  ];

  return (
    <motion.div 
      className="relative flex flex-col items-center justify-center min-h-[60vh] px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="decorative-blob w-96 h-96 -top-48 -left-48 opacity-20" />
        <div className="decorative-blob w-96 h-96 -bottom-48 -right-48 opacity-20" style={{ background: 'var(--gradient-secondary)' }} />
        <div className="absolute inset-0 decorative-grid opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
          <span className="text-sm font-semibold text-primary">AI-Powered Learning Platform</span>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h1 className="text-display-md md:text-display-lg font-extrabold leading-tight">
            <span className="text-foreground">Your Personal</span>
            <br />
            <span className="text-gradient">AI Study Partner</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Study AI आपको हर विषय में मदद करता है। Homework, Exam Prep, Notes - 
            सब कुछ एक जगह। अभी शुरू करें!
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm"
            >
              <feature.icon className={`w-4 h-4 ${feature.color}`} />
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={onStartChat}
            size="lg"
            className="btn-study-primary min-w-[200px] text-lg"
          >
            Start Learning
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={() => navigate('/student-activities')}
            variant="outline"
            size="lg"
            className="btn-study-secondary min-w-[200px] text-lg"
          >
            Explore Features
          </Button>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>100% Free</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>24/7 Available</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span>All Subjects</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeHero;
