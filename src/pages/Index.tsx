
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ChevronRight,
  X
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { avatarUrl: profileAvatarUrl } = useAvatarUrl(currentUser?.uid);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      await logout();
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Feature items for sidebar
  const featureItems = [
    { icon: Plus, label: 'New Chat', action: () => { handleNewChat(); setIsSidebarOpen(false); } },
    { icon: FileText, label: 'Notes Creator', path: '/notes-creator', description: 'Create study notes' },
    { icon: BookOpen, label: 'Quiz Generator', path: '/quiz-generator', description: 'Generate quizzes' },
    { icon: GraduationCap, label: 'Ask Teacher', path: '/teacher-chats', description: 'Live teaching' },
    { icon: Clock, label: 'Study Planner', path: '/study-planner', description: 'Plan your study' },
    { icon: BookOpen, label: 'Homework Helper', path: '/homework-helper', description: 'Homework assistance' },
    { icon: Youtube, label: 'Study Tube', path: '/study-tube', description: 'Educational videos' },
  ];

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
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

  // Prevent auto-scroll on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      <div className="flex min-h-screen bg-background">
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
                  {featureItems.slice(1).map((item) => (
                    <Link
                      key={item.label}
                      to={item.path!}
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
                    <Button className="w-full">Login</Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
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

          {/* Chat Content */}
          <main className="flex-1 overflow-hidden">
            {currentChatId ? (
              <Chat chatId={currentChatId} onChatUpdated={() => {}} />
            ) : (
              // Welcome Screen
              <div className="h-full flex flex-col items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-2xl"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
                    {getGreeting()}{currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''}!
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    How can I help you with your studies today?
                  </p>

                  {/* Quick Action Cards */}
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-8">
                    <Link to="/notes-creator">
                      <div className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer text-left">
                        <FileText className="w-5 h-5 text-primary mb-2" />
                        <p className="font-medium text-sm">Create Notes</p>
                        <p className="text-xs text-muted-foreground">Generate study notes</p>
                      </div>
                    </Link>
                    <Link to="/quiz-generator">
                      <div className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer text-left">
                        <BookOpen className="w-5 h-5 text-primary mb-2" />
                        <p className="font-medium text-sm">Create Quiz</p>
                        <p className="text-xs text-muted-foreground">Test your knowledge</p>
                      </div>
                    </Link>
                    <Link to="/study-planner">
                      <div className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer text-left">
                        <Clock className="w-5 h-5 text-primary mb-2" />
                        <p className="font-medium text-sm">Study Planner</p>
                        <p className="text-xs text-muted-foreground">Plan your schedule</p>
                      </div>
                    </Link>
                    <Link to="/teacher-chats">
                      <div className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer text-left">
                        <GraduationCap className="w-5 h-5 text-primary mb-2" />
                        <p className="font-medium text-sm">Ask Teacher</p>
                        <p className="text-xs text-muted-foreground">Get expert help</p>
                      </div>
                    </Link>
                  </div>

                  {/* Start Chat Button */}
                  <Button 
                    onClick={handleNewChat}
                    size="lg"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Start a new chat
                  </Button>
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
