
import React from "react";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, Star, CloudSun, CircleEllipsis } from "lucide-react";

interface LoadingAnimationProps {
  message?: string;
  className?: string;
}

const LoadingAnimation = ({
  message = "Study AI सोच रहा है...",
  className,
}: LoadingAnimationProps) => {
  return (
    <div className={cn(
      "w-full flex flex-col items-center justify-center p-4 my-4",
      className
    )}>
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Cosmic Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/40 via-fuchsia-300/40 to-pink-400/40 dark:from-purple-600/30 dark:via-fuchsia-500/30 dark:to-pink-600/30 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite_alternate]"></div>
        <div className="absolute inset-3 bg-gradient-to-tr from-violet-300/30 to-indigo-400/30 dark:from-violet-500/20 dark:to-indigo-600/20 rounded-full blur-2xl animate-[pulse_4s_ease-in-out_0.5s_infinite_alternate]"></div>
        
        {/* Aurora Effect */}
        <div className="absolute w-full h-full animate-[spin_20s_linear_infinite] opacity-50">
          <div className="absolute inset-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-xl"></div>
        </div>
        <div className="absolute w-full h-full animate-[spin_15s_linear_infinite_reverse] opacity-50">
          <div className="absolute inset-8 rounded-full bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 blur-xl"></div>
        </div>
        
        {/* Magical Particles */}
        <div className="absolute w-full h-full">
          {/* Orbital Particles */}
          <div className="absolute w-full h-full animate-[spin_8s_linear_infinite]">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gradient-to-r from-pink-400 to-rose-400 dark:from-pink-300 dark:to-rose-300 rounded-full shadow-lg shadow-pink-400/50 dark:shadow-pink-300/50 animate-pulse"></div>
          </div>
          <div className="absolute w-full h-full animate-[spin_12s_linear_infinite_reverse]">
            <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-400 dark:from-yellow-300 dark:to-amber-300 rounded-full shadow-lg shadow-yellow-400/50 dark:shadow-yellow-300/50 animate-pulse"></div>
          </div>
          <div className="absolute w-full h-full animate-[spin_10s_linear_infinite]">
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-r from-teal-400 to-cyan-400 dark:from-teal-300 dark:to-cyan-300 rounded-full shadow-lg shadow-teal-400/50 dark:shadow-teal-300/50 animate-pulse"></div>
          </div>
          <div className="absolute w-full h-full animate-[spin_7s_linear_infinite_reverse]">
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-blue-400 to-indigo-400 dark:from-blue-300 dark:to-indigo-300 rounded-full shadow-lg shadow-blue-400/50 dark:shadow-blue-300/50 animate-pulse"></div>
          </div>
          
          {/* Floating Stars & Elements */}
          <div className="absolute top-0 left-1/4 animate-[float_3s_ease-in-out_infinite]">
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
          </div>
          <div className="absolute bottom-3 right-1/4 animate-[float_4s_ease-in-out_0.5s_infinite_alternate]">
            <Star className="w-5 h-5 text-fuchsia-300 fill-fuchsia-300 animate-pulse drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]" />
          </div>
          <div className="absolute top-1/3 right-1/5 animate-[float_5s_ease-in-out_1s_infinite]">
            <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse drop-shadow-[0_0_8px_rgba(103,232,249,0.7)]" />
          </div>
          <div className="absolute bottom-1/4 left-1/5 animate-[float_4.5s_ease-in-out_0.7s_infinite_alternate]">
            <CloudSun className="w-5 h-5 text-amber-300 animate-pulse drop-shadow-[0_0_8px_rgba(252,211,77,0.7)]" />
          </div>
        </div>
        
        {/* Central Portal */}
        <div className="relative flex items-center justify-center w-32 h-32 animate-[pulse_3s_ease-in-out_infinite]">
          {/* Mystic Rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/90 via-violet-500/90 to-indigo-500/90 dark:from-purple-600/90 dark:via-violet-600/90 dark:to-indigo-600/90 backdrop-blur-sm border border-white/30 dark:border-white/10 shadow-[0_0_40px_rgba(109,40,217,0.5)]"></div>
          <div className="absolute inset-0 border-t-4 border-r-4 border-b-transparent border-l-transparent border-purple-300/70 dark:border-purple-400/70 rounded-full animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-1 border-t-transparent border-r-4 border-b-4 border-l-transparent border-indigo-300/70 dark:border-indigo-400/70 rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
          <div className="absolute inset-3 border-t-4 border-r-transparent border-b-transparent border-l-4 border-violet-300/70 dark:border-violet-400/70 rounded-full animate-[spin_5s_linear_infinite]"></div>
          <div className="absolute inset-5 border-t-transparent border-r-transparent border-b-4 border-l-4 border-fuchsia-300/70 dark:border-fuchsia-400/70 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
          
          {/* Energy Core */}
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white/90 via-purple-50/90 to-indigo-50/90 dark:from-gray-800/90 dark:via-gray-700/90 dark:to-gray-900/90 rounded-full shadow-inner animate-pulse z-10 overflow-hidden backdrop-blur-sm border border-white/40 dark:border-white/10">
            {/* Energy Waves */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-transparent to-indigo-100/30 dark:from-purple-500/20 dark:via-transparent dark:to-indigo-500/10 rounded-full"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/90 to-transparent dark:from-white/10 dark:to-transparent rounded-full animate-[spin_3s_linear_infinite] opacity-70"></div>
            
            {/* Pulsing Brain */}
            <div className="relative animate-pulse">
              <Brain className="w-12 h-12 text-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-purple-400 dark:via-violet-400 dark:to-indigo-400 drop-shadow-[0_0_10px_rgba(147,51,234,0.7)]" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Message Display */}
      <div className="mt-6 text-center relative">
        <div className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-purple-50/90 to-indigo-50/90 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-full shadow-xl border border-white/30 dark:border-white/10 backdrop-blur-sm">
          <CircleEllipsis className="w-5 h-5 text-purple-500 dark:text-purple-300 animate-[pulse_1.5s_ease-in-out_infinite]" />
          <span className="text-purple-700 dark:text-purple-200 font-medium animate-pulse text-lg">{message}</span>
          <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-300 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
        
        {/* Radial Glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-pink-500/5 dark:from-purple-500/10 dark:via-indigo-500/10 dark:to-pink-500/10 rounded-full blur-xl"></div>
      </div>
      
      {/* Enhanced Loading Dots */}
      <div className="mt-5 flex items-center gap-2.5">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.6)] animate-[bounce_0.6s_infinite_0ms]"></div>
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-[bounce_0.6s_infinite_150ms]"></div>
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-400 dark:to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] animate-[bounce_0.6s_infinite_300ms]"></div>
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 dark:from-fuchsia-400 dark:to-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)] animate-[bounce_0.6s_infinite_450ms]"></div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
