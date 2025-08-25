
import React from 'react';
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Zap, Trophy, Settings } from 'lucide-react';

interface NavigationBarProps {
  currentView: string;
  onBackToManagement: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentView, onBackToManagement }) => {
  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <Button 
        variant="outline" 
        onClick={onBackToManagement}
        className="flex items-center gap-1 text-xs px-2 py-1 h-8"
        size="sm"
      >
        <Settings className="h-3 w-3" />
        <span className="hidden sm:inline">Plans</span>
      </Button>

      <div className="flex items-center space-x-1 overflow-x-auto">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
          currentView === 'input' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <BookOpen className="h-3 w-3" />
          <span className="hidden sm:inline">Input</span>
        </div>
        <div className="w-2 h-px bg-gray-300"></div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
          currentView === 'plan' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <Brain className="h-3 w-3" />
          <span className="hidden sm:inline">Plan</span>
        </div>
        <div className="w-2 h-px bg-gray-300"></div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
          currentView === 'strategy' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <Zap className="h-3 w-3" />
          <span className="hidden sm:inline">Strategy</span>
        </div>
        <div className="w-2 h-px bg-gray-300"></div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
          currentView === 'track' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <Trophy className="h-3 w-3" />
          <span className="hidden sm:inline">Track</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
