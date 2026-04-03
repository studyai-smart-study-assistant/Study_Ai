
import React from 'react';
import { Brain, Search, Sparkles, Zap, Paintbrush, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusIndicatorProps {
  status: string;
  text: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; pulse: boolean }> = {
  thinking: { icon: Brain, color: 'text-purple-500', pulse: true },
  connecting: { icon: Zap, color: 'text-amber-500', pulse: true },
  generating: { icon: Sparkles, color: 'text-cyan-500', pulse: false },
  responding: { icon: Sparkles, color: 'text-cyan-500', pulse: true },
  tool_executing: { icon: Search, color: 'text-emerald-500', pulse: true },
  processing_results: { icon: Loader2, color: 'text-blue-500', pulse: false },
  done: { icon: CheckCircle, color: 'text-green-500', pulse: false },
};

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ status, text }) => {
  const config = statusConfig[status] || statusConfig.thinking;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 px-4 sm:px-8 py-2 max-w-[760px] mx-auto w-full animate-fade-in">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        "bg-muted/50 border border-border/50 backdrop-blur-sm"
      )}>
        <Icon className={cn(
          "w-3.5 h-3.5",
          config.color,
          config.pulse && "animate-pulse",
          status === 'processing_results' && "animate-spin"
        )} />
        <span className="text-muted-foreground">{text}</span>
        {status !== 'done' && (
          <span className="flex gap-0.5">
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
