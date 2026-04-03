
import React from 'react';
import { Brain, Search, Sparkles, Globe2, CheckCircle2, Loader2, Wrench, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusIndicatorProps {
  status: string;
  text: string;
  tool?: string;
  provider?: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; pulse: boolean; spin?: boolean; glow: string }> = {
  thinking: { icon: Brain, color: 'text-violet-500', pulse: true, glow: 'from-violet-500/25 to-indigo-500/20' },
  connecting: { icon: Radio, color: 'text-amber-500', pulse: true, glow: 'from-amber-500/25 to-orange-500/20' },
  generating: { icon: Sparkles, color: 'text-cyan-500', pulse: true, glow: 'from-cyan-500/25 to-blue-500/20' },
  tool_executing: { icon: Wrench, color: 'text-emerald-500', pulse: true, glow: 'from-emerald-500/25 to-teal-500/20' },
  processing_results: { icon: Loader2, color: 'text-blue-500', pulse: false, spin: true, glow: 'from-blue-500/25 to-indigo-500/20' },
  done: { icon: CheckCircle2, color: 'text-green-500', pulse: false, glow: 'from-green-500/25 to-emerald-500/20' },
};

const toolIconMap: Record<string, React.ElementType> = {
  web_search: Globe2,
  fetch_news: Globe2,
  deep_research: Search,
};

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ status, text, tool, provider }) => {
  const config = statusConfig[status] || statusConfig.thinking;
  const Icon = status === 'tool_executing' && tool ? (toolIconMap[tool] || Search) : config.icon;

  return (
    <div className="flex items-center gap-2 px-4 sm:px-8 py-2 max-w-[760px] mx-auto w-full animate-fade-in">
      <div className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium relative overflow-hidden",
        "bg-muted/60 border border-border/50 backdrop-blur-sm shadow-sm"
      )}>
        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-70", config.glow)} />
        <Icon className={cn(
          "w-3.5 h-3.5 relative z-10",
          config.color,
          config.pulse && "animate-pulse",
          config.spin && "animate-spin"
        )} />
        <span className="text-muted-foreground relative z-10">{text}</span>
        {provider && status === 'generating' && (
          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-background/70 border border-border/40 text-muted-foreground relative z-10">
            {provider}
          </span>
        )}
        {status !== 'done' && (
          <span className="flex gap-0.5 relative z-10">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  );
};

export default AgentStatusIndicator;
