
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, Star, Zap, Atom, Search, FileText, HelpCircle, Image } from "lucide-react";

interface EnhancedLoadingAnimationProps {
  message?: string;
  className?: string;
}

const thinkingStages = [
  { text: "सवाल समझ रहा हूँ...", icon: Brain, color: "text-purple-500" },
  { text: "सोच रहा हूँ क्या करना है...", icon: Sparkles, color: "text-indigo-500" },
  { text: "जवाब तैयार कर रहा हूँ...", icon: Zap, color: "text-cyan-500" },
];

const toolStages: Record<string, { text: string; icon: any; color: string }[]> = {
  searching: [
    { text: "🔍 वेब पर खोज रहा हूँ...", icon: Search, color: "text-emerald-500" },
    { text: "📡 ताज़ा जानकारी ला रहा हूँ...", icon: Search, color: "text-teal-500" },
  ],
  notes: [
    { text: "📝 नोट्स तैयार कर रहा हूँ...", icon: FileText, color: "text-blue-500" },
    { text: "📚 Content organize कर रहा हूँ...", icon: FileText, color: "text-indigo-500" },
  ],
  quiz: [
    { text: "🎯 Quiz बना रहा हूँ...", icon: HelpCircle, color: "text-amber-500" },
    { text: "✍️ Questions तैयार कर रहा हूँ...", icon: HelpCircle, color: "text-orange-500" },
  ],
  image: [
    { text: "🎨 Image generate कर रहा हूँ...", icon: Image, color: "text-violet-500" },
    { text: "🖼️ Visual बना रहा हूँ...", icon: Image, color: "text-pink-500" },
  ],
};

const EnhancedLoadingAnimation = ({
  message = "Study AI सोच रहा है...",
  className,
}: EnhancedLoadingAnimationProps) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [showToolHint, setShowToolHint] = useState(false);

  // Detect tool hint from message
  const getActiveStages = () => {
    const msg = message.toLowerCase();
    if (msg.includes('web search') || msg.includes('खोज')) return [...thinkingStages, ...toolStages.searching];
    if (msg.includes('notes') || msg.includes('नोट')) return [...thinkingStages, ...toolStages.notes];
    if (msg.includes('quiz') || msg.includes('test')) return [...thinkingStages, ...toolStages.quiz];
    if (msg.includes('image') || msg.includes('diagram')) return [...thinkingStages, ...toolStages.image];
    return thinkingStages;
  };

  const stages = getActiveStages();

  useEffect(() => {
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % stages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [message, stages.length]);

  const currentStage = stages[stageIndex];
  const StageIcon = currentStage.icon;

  return (
    <div className={cn(
      "w-full flex flex-col items-center justify-center p-6 my-4",
      className
    )}>
      {/* Compact Animation Container */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-cyan-500/15 animate-[spin_8s_linear_infinite] blur-sm"></div>
        
        {/* Pulsing Field */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-purple-400/20 via-pink-400/20 to-orange-400/20 animate-[pulse_3s_ease-in-out_infinite] blur-lg"></div>
        
        {/* Rings */}
        <div className="absolute inset-6 border-2 border-purple-300/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
        <div className="absolute inset-10 border border-cyan-300/30 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
        
        {/* Central Core */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-500 rounded-full shadow-2xl shadow-purple-500/40 animate-[pulse_2.5s_ease-in-out_infinite]">
          <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
          <div className="relative animate-[float_3s_ease-in-out_infinite]">
            <StageIcon className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
          <div className="absolute inset-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]">
            <div className="w-full h-full bg-purple-400/20 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Status Message */}
      <div className="mt-5 text-center relative">
        <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-cyan-900/30 rounded-2xl shadow-lg border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
          <span className={cn("transition-all duration-500", currentStage.color)}>
            <StageIcon className="w-5 h-5" />
          </span>
          <span className="text-foreground/80 font-medium text-sm animate-[pulse_2s_ease-in-out_infinite] transition-all duration-500 min-w-[180px] text-center">
            {currentStage.text}
          </span>
        </div>
      </div>
      
      {/* Progress Dots */}
      <div className="mt-4 flex items-center gap-2">
        {stages.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === stageIndex
                ? "w-6 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md shadow-purple-500/50"
                : i < stageIndex
                ? "bg-purple-400/60"
                : "bg-muted-foreground/20"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default EnhancedLoadingAnimation;
