
import React from 'react';
import { Brain, Search, Sparkles, Globe2, CheckCircle2, Loader2, Wrench, Radio, BookOpen, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusIndicatorProps {
  status: string;
  text: string;
  tool?: string;
  provider?: string;
}

const statusConfig: Record<string, { icon: React.ElementType; gradient: string; pulse: boolean; spin?: boolean }> = {
  thinking: { icon: Brain, gradient: 'from-violet-500 via-purple-500 to-indigo-500', pulse: true },
  analyzing: { icon: BarChart3, gradient: 'from-blue-500 via-cyan-500 to-teal-500', pulse: true },
  connecting: { icon: Radio, gradient: 'from-amber-500 via-orange-500 to-yellow-500', pulse: true },
  generating: { icon: Sparkles, gradient: 'from-cyan-400 via-blue-500 to-violet-500', pulse: true },
  tool_executing: { icon: Wrench, gradient: 'from-emerald-500 via-green-500 to-teal-500', pulse: true },
  processing_results: { icon: Loader2, gradient: 'from-blue-500 via-indigo-500 to-purple-500', pulse: false, spin: true },
  preparing: { icon: Zap, gradient: 'from-pink-500 via-rose-500 to-red-500', pulse: true },
  done: { icon: CheckCircle2, gradient: 'from-green-400 via-emerald-500 to-teal-500', pulse: false },
};

const toolIconMap: Record<string, React.ElementType> = {
  web_search: Globe2,
  fetch_news: Globe2,
  deep_research: Search,
  generate_image: Sparkles,
  notes: BookOpen,
};

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ status, text, tool, provider }) => {
  const config = statusConfig[status] || statusConfig.thinking;
  const Icon = status === 'tool_executing' && tool ? (toolIconMap[tool] || Search) : config.icon;

  return (
    <div className="flex items-center gap-2 px-4 sm:px-8 py-2.5 max-w-[760px] mx-auto w-full animate-fade-in">
      <div className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-medium relative overflow-hidden",
        "bg-card/80 border border-border/40 backdrop-blur-md shadow-lg"
      )}>
        {/* Animated gradient background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-[0.08]",
          `bg-gradient-to-r ${config.gradient}`
        )} />
        
        {/* Shimmer effect */}
        {status !== 'done' && (
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
              style={{ animation: 'shimmer 2s infinite' }}
            />
          </div>
        )}
        
        {/* Glow ring around icon */}
        <div className="relative z-10">
          <div className={cn(
            "absolute -inset-1 rounded-full opacity-40 blur-sm bg-gradient-to-r",
            config.gradient,
            config.pulse && "animate-pulse"
          )} />
          <Icon className={cn(
            "w-4 h-4 relative",
            "text-foreground/90",
            config.spin && "animate-spin"
          )} />
        </div>
        
        <span className="text-foreground/80 relative z-10 font-medium">{text}</span>
        
        {provider && status === 'generating' && (
          <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary relative z-10 font-semibold">
            {provider}
          </span>
        )}
        
        {status !== 'done' && (
          <span className="flex gap-[3px] relative z-10 ml-1">
            {[0, 1, 2].map(i => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary/60 to-primary"
                style={{ 
                  animation: 'pulse-dot 1.4s infinite',
                  animationDelay: `${i * 200}ms`
                }} 
              />
            ))}
          </span>
        )}
      </div>
      
      {/* Inline CSS for custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default AgentStatusIndicator;
