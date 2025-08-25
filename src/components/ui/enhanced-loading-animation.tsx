
import React from "react";
import { cn } from "@/lib/utils";
import { Brain, Sparkles, Star, Zap, CircleDot, Atom } from "lucide-react";

interface EnhancedLoadingAnimationProps {
  message?: string;
  className?: string;
}

const EnhancedLoadingAnimation = ({
  message = "Study AI सोच रहा है...",
  className,
}: EnhancedLoadingAnimationProps) => {
  return (
    <div className={cn(
      "w-full flex flex-col items-center justify-center p-6 my-6",
      className
    )}>
      {/* Main Animation Container */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer Cosmic Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 animate-[spin_8s_linear_infinite] blur-sm"></div>
        
        {/* Pulsing Energy Field */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-purple-400/30 via-pink-400/30 to-orange-400/30 animate-[pulse_3s_ease-in-out_infinite] blur-lg"></div>
        
        {/* Floating Particles */}
        <div className="absolute w-full h-full">
          {/* Orbiting Elements */}
          <div className="absolute w-full h-full animate-[spin_6s_linear_infinite]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg shadow-yellow-400/50 animate-[bounce_2s_ease-in-out_infinite]">
              <Sparkles className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div className="absolute w-full h-full animate-[spin_8s_linear_infinite_reverse]">
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-7 h-7 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-lg shadow-cyan-400/50 animate-[bounce_2.5s_ease-in-out_0.5s_infinite]">
              <Star className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-current" />
            </div>
          </div>
          
          <div className="absolute w-full h-full animate-[spin_10s_linear_infinite]">
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg shadow-emerald-400/50 animate-[bounce_3s_ease-in-out_1s_infinite]">
              <Zap className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div className="absolute w-full h-full animate-[spin_7s_linear_infinite_reverse]">
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-400/50 animate-[bounce_2.2s_ease-in-out_0.8s_infinite]">
              <Atom className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
        
        {/* Inner Energy Rings */}
        <div className="absolute inset-8 border-2 border-purple-300/40 rounded-full animate-[spin_4s_linear_infinite]"></div>
        <div className="absolute inset-12 border-2 border-cyan-300/40 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
        <div className="absolute inset-16 border border-pink-300/40 rounded-full animate-[spin_3s_linear_infinite]"></div>
        
        {/* Central Brain Core */}
        <div className="relative z-10 flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-500 rounded-full shadow-2xl shadow-purple-500/40 animate-[pulse_2.5s_ease-in-out_infinite]">
          {/* Inner Glow */}
          <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
          
          {/* Animated Brain */}
          <div className="relative animate-[float_3s_ease-in-out_infinite]">
            <Brain className="w-12 h-12 text-white drop-shadow-lg" />
            
            {/* Neural Activity */}
            <div className="absolute inset-0 animate-[pulse_1.5s_ease-in-out_infinite]">
              <div className="w-full h-full bg-gradient-to-r from-yellow-300/30 to-orange-300/30 rounded-full blur-sm"></div>
            </div>
          </div>
          
          {/* Energy Pulses */}
          <div className="absolute inset-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]">
            <div className="w-full h-full bg-purple-400/30 rounded-full"></div>
          </div>
        </div>
        
        {/* Floating Dots */}
        <div className="absolute top-8 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-[float_4s_ease-in-out_infinite] shadow-lg shadow-yellow-400/50"></div>
        <div className="absolute top-12 right-12 w-3 h-3 bg-pink-400 rounded-full animate-[float_3.5s_ease-in-out_0.5s_infinite] shadow-lg shadow-pink-400/50"></div>
        <div className="absolute bottom-10 left-16 w-2 h-2 bg-cyan-400 rounded-full animate-[float_4.5s_ease-in-out_1s_infinite] shadow-lg shadow-cyan-400/50"></div>
        <div className="absolute bottom-16 right-8 w-2 h-2 bg-emerald-400 rounded-full animate-[float_3.2s_ease-in-out_0.7s_infinite] shadow-lg shadow-emerald-400/50"></div>
      </div>
      
      {/* Enhanced Message Display */}
      <div className="mt-8 text-center relative">
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-cyan-50/80 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-cyan-900/30 rounded-2xl shadow-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <CircleDot className="w-5 h-5 text-purple-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
            <CircleDot className="w-5 h-5 text-indigo-500 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]" />
            <CircleDot className="w-5 h-5 text-cyan-500 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]" />
          </div>
          
          <span className="text-purple-700 dark:text-purple-200 font-semibold text-lg animate-[pulse_2s_ease-in-out_infinite]">
            {message}
          </span>
          
          <div className="flex items-center gap-1">
            <CircleDot className="w-5 h-5 text-cyan-500 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]" />
            <CircleDot className="w-5 h-5 text-indigo-500 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]" />
            <CircleDot className="w-5 h-5 text-purple-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
        
        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-cyan-500/5 rounded-2xl blur-xl scale-110"></div>
      </div>
      
      {/* Enhanced Progress Dots */}
      <div className="mt-6 flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50 animate-[bounce_0.8s_infinite_0ms]"></div>
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/50 animate-[bounce_0.8s_infinite_200ms]"></div>
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/50 animate-[bounce_0.8s_infinite_400ms]"></div>
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg shadow-teal-500/50 animate-[bounce_0.8s_infinite_600ms]"></div>
      </div>
    </div>
  );
};

export default EnhancedLoadingAnimation;
