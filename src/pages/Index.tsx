
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Chat from '@/components/Chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useChatInitialization } from '@/hooks/home/useChatInitialization';
import { useHomeEffects } from '@/hooks/home/useHomeEffects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  FileText,
  BookOpen,
  ClipboardList,
  Plus,
  ArrowUp,
} from 'lucide-react';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

const Index = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { currentUser, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentChatId,
    isLoading,
    initializeChat,
    handleNavigationState,
    handleNewChat
  } = useChatInitialization();

  useHomeEffects({
    authLoading,
    isLoading,
    location,
    initializeChat,
    handleNavigationState
  });

  // Handle newChat trigger from AppShell
  useEffect(() => {
    if (location.state?.newChat) {
      handleNewChat();
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.newChat]);

  // Show signup prompt for guests after 60 seconds
  useEffect(() => {
    if (!currentUser && !authLoading) {
      const timer = setTimeout(() => {
        setShowSignupPrompt(true);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, authLoading]);

  const handleStartChat = async () => {
    if (!inputMessage.trim()) return;
    await handleNewChat();
  };

  const quickActions = [
    { icon: FileText, label: 'Notes', path: '/notes-creator', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400', iconColor: 'text-blue-500' },
    { icon: BookOpen, label: 'Quiz', path: '/quiz-generator', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400', iconColor: 'text-green-500' },
    { icon: ClipboardList, label: 'Homework', path: '/homework-helper', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-400', iconColor: 'text-orange-500' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full overflow-hidden">
        {currentChatId ? (
          <Chat chatId={currentChatId} onChatUpdated={() => {}} />
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* Centered Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <h1 className="text-xl sm:text-2xl font-normal text-foreground mb-8">
                {getGreeting()}{currentUser?.displayName ? ` ${currentUser.displayName.split(' ')[0]}` : ''}
              </h1>

              <div className="w-full max-w-md h-px bg-border mb-12" />

              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-8">
                What can I help You Today
              </h2>

              {/* Quick Action Chips */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {quickActions.map((action) => (
                  <Link key={action.path} to={action.path}>
                    <div className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer transition-colors",
                      action.bgColor
                    )}>
                      <action.icon className={cn("w-4 h-4", action.iconColor)} />
                      <span className={cn("text-sm font-medium", action.textColor)}>
                        {action.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Input Box - Bottom */}
            <div className="p-4 pb-6">
              <div className="max-w-2xl mx-auto">
                <div className="relative flex items-center bg-secondary/30 rounded-full border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full ml-1 text-muted-foreground"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Input
                    ref={inputRef}
                    placeholder="ask anything"
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 h-12 px-2 text-base placeholder:text-muted-foreground/60"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleStartChat();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-full mr-1"
                    onClick={handleStartChat}
                    disabled={!inputMessage.trim()}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signup Prompt Dialog for Guests */}
        <SignupPromptDialog
          open={showSignupPrompt}
          onOpenChange={setShowSignupPrompt}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
