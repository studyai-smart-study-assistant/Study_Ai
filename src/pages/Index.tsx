
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import Chat from '@/components/Chat';
import DailyLoginBonus from '@/components/student/DailyLoginBonus';
import LoadingScreen from '@/components/home/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAutoLoginBonus } from '@/hooks/home/useAutoLoginBonus';
import { useChatInitialization } from '@/hooks/home/useChatInitialization';
import { useHomeEffects } from '@/hooks/home/useHomeEffects';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Plus, 
  Send, 
  Sparkles,
  FileText,
  BookOpen,
  GraduationCap,
  Trophy,
  Clock,
  Bookmark,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Home,
  MessageSquare,
  Youtube,
  Wallet,
  Info,
  X,
  ArrowUp,
  MoreHorizontal
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { avatarUrl: profileAvatarUrl } = useAvatarUrl(currentUser?.uid);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { loginBonusPoints, streakDays } = useAutoLoginBonus();
  
  const {
    currentChatId,
    isLoading,
    initializeChat,
    handleNavigationState,
    handleNewChat,
    handleChatSelect
  } = useChatInitialization();

  useHomeEffects({
    authLoading,
    isLoading,
    location,
    initializeChat,
    handleNavigationState
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear all local storage related to the user
      if (currentUser?.uid) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith(`${currentUser.uid}_`) || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      await logout();
      setIsSidebarOpen(false);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleStartChat = async () => {
    if (!inputMessage.trim()) return;
    
    // Create a new chat and send the first message
    await handleNewChat();
  };

  // Feature items for sidebar
  const featureItems = [
    { icon: FileText, label: 'Notes Creator', path: '/notes-creator' },
    { icon: BookOpen, label: 'Quiz Generator', path: '/quiz-generator' },
    { icon: GraduationCap, label: 'Ask Teacher', path: '/teacher-chats' },
    { icon: Clock, label: 'Study Planner', path: '/study-planner' },
    { icon: BookOpen, label: 'Homework Helper', path: '/homework-helper' },
    { icon: Youtube, label: 'Study Tube', path: '/study-tube' },
  ];

  const navigationItems = [
    { icon: MessageSquare, label: 'Chat History', path: '/chat-history' },
    { icon: Bookmark, label: 'Saved', path: '/saved-messages' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Points Wallet', path: '/points-wallet' },
    { icon: GraduationCap, label: 'Activities', path: '/student-activities' },
  ];

  const bottomItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Info, label: 'About', path: '/about' },
  ];

  // Quick actions for the welcome screen
  const quickActions = [
    { icon: FileText, label: 'Create Notes', path: '/notes-creator', description: 'Generate study notes' },
    { icon: BookOpen, label: 'Create Quiz', path: '/quiz-generator', description: 'Test your knowledge' },
    { icon: BookOpen, label: 'Check Homework', path: '/homework-helper', description: 'Get homework help' },
  ];

  if (isLoading || authLoading) {
    return <LoadingScreen />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar Sheet for Mobile */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-background border-r border-border">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-lg">Study AI</span>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </div>

              {/* New Chat Button */}
              <div className="p-3">
                <Button 
                  onClick={() => { handleNewChat(); setIsSidebarOpen(false); }}
                  className="w-full justify-start gap-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  variant="secondary"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </Button>
              </div>

              <ScrollArea className="flex-1 px-3">
                {/* Features Section */}
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-medium text-muted-foreground px-3 py-2">FEATURES</p>
                  {featureItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        location.pathname === item.path 
                          ? "bg-secondary text-foreground" 
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Navigation Section */}
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-medium text-muted-foreground px-3 py-2">NAVIGATION</p>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        location.pathname === item.path 
                          ? "bg-secondary text-foreground" 
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Bottom Items */}
                <div className="space-y-1">
                  {bottomItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        location.pathname === item.path 
                          ? "bg-secondary text-foreground" 
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </ScrollArea>

              {/* Bottom Section */}
              <div className="p-3 border-t border-border space-y-2">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </Button>

                {currentUser ? (
                  <>
                    {/* User Info */}
                    <Link 
                      to="/profile" 
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {currentUser.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{currentUser.displayName || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                      </div>
                    </Link>

                    {/* Logout Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </Button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsSidebarOpen(false)}>
                    <Button className="w-full">Login / Register</Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(true)}
                className="h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold hidden sm:inline">Study AI</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUser ? (
                <Link to="/profile">
                  <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                    <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="sm">Login</Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-9 w-9"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Chat Content - Fixed height, no scrolling on home */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {currentChatId ? (
              <Chat chatId={currentChatId} onChatUpdated={() => {}} />
            ) : (
              // Welcome Screen - Centered, no scroll
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center w-full max-w-lg"
                >
                  {/* Greeting */}
                  <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
                      {getGreeting()}{currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''}!
                    </h1>
                    <p className="text-muted-foreground">
                      How can I help you today?
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {quickActions.map((action) => (
                      <Link key={action.path} to={action.path}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full gap-2 h-9 px-4"
                        >
                          <action.icon className="w-4 h-4" />
                          {action.label}
                        </Button>
                      </Link>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-2 h-9 px-4"
                      onClick={() => setIsSidebarOpen(true)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      More
                    </Button>
                  </div>

                  {/* Input Box - ChatGPT Style */}
                  <div className="w-full">
                    <div 
                      className="relative flex items-center bg-secondary/50 rounded-2xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => handleNewChat()}
                    >
                      <Input
                        ref={inputRef}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 h-12 px-4 text-base"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleNewChat();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button 
                        size="icon" 
                        className="h-9 w-9 rounded-full mr-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNewChat();
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Study AI can make mistakes. Check important info.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </main>
        </div>

        {/* Daily Login Bonus */}
        {currentUser && loginBonusPoints > 0 && (
          <DailyLoginBonus 
            userId={currentUser.uid}
            points={loginBonusPoints}
            streakDays={streakDays}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
