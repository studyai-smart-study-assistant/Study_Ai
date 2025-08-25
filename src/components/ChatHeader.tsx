
import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu, Plus, Clock, MoonStar, Sun } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from "@/lib/utils";
import { useTheme } from '@/providers/ThemeProvider';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  className?: string;
  children?: React.ReactNode;
  currentChatId?: string;
  chatParticipant?: {
    user_id: string;
    name: string;
  };
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onToggleSidebar, 
  onNewChat, 
  className,
  children,
  currentChatId,
  chatParticipant,
}) => {
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  return (
    <header className={cn("flex items-center justify-between px-4 py-2 border-b", className)}>
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleSidebar}
          className="h-9 w-9 mr-2"
        >
          <Menu size={20} />
        </Button>
      )}

      <Button 
        className="flex items-center gap-2 p-3 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 font-normal dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
        variant="ghost"
        onClick={onNewChat}
      >
        <Plus size={16} />
        <span className="text-sm">New chat</span>
      </Button>

      <div className="flex items-center gap-2">
        
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500"
        >
          <Clock size={18} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun size={18} /> : <MoonStar size={18} />}
        </Button>
        
        {children}
      </div>
    </header>
  );
};

export default ChatHeader;
