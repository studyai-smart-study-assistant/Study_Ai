
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Chat from '@/components/Chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useChatInitialization } from '@/hooks/home/useChatInitialization';
import { useHomeEffects } from '@/hooks/home/useHomeEffects';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Plus, 
  Sparkles,
  FileText,
  BookOpen,
  GraduationCap,
  Trophy,
  Clock,
  Bookmark,
  User,
  LogOut,
  Moon,
  Sun,
  MessageSquare,
  Youtube,
  Wallet,
  Info,
  X,
  ArrowUp,
  ClipboardList
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { avatarUrl: profileAvatarUrl } = useAvatarUrl(currentUser?.uid);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  // Show signup prompt for guests after 60 seconds
  useEffect(() => {
    if (!currentUser && !authLoading) {
      const timer = setTimeout(() => {
        setShowSignupPrompt(true);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, authLoading]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
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
    await handleNewChat();
    setShowChat(true);
    // Keep the text so user can paste/send again in the chat input if needed
  };

  // Feature items for sidebar
  const featureItems = [
    { icon: FileText, label: 'Notes Creator', path: '/notes-creator' },
    { icon: BookOpen, label: 'Quiz Generator', path: '/quiz-generator' },
    { icon: GraduationCap, label: 'Ask Teacher', path: '/teacher-chats' },
    { icon: Clock, label: 'Study Planner', path: '/study-planner' },
    { icon: ClipboardList, label: 'Homework Helper', path: '/homework-helper' },
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

  const examples = [
    {
      icon: MessageSquare,
      text: 'Explain quantum computing in simple terms'
    },
    {
      icon: FileText,
      text: 'Generate a React component for a contact form'
    },
    {
      icon: Sparkles,
      text: 'Summarize this topic for a 2nd grader'
    },
    {
      icon: BookOpen,
      text: 'Give me ideas for my next vacation'
    }
  ];

  const homeTiles = [
    { label: 'Teacher Chats', path: '/teacher-chats', icon: GraduationCap },
    { label: 'Student Activities', path: '/student-activities', icon: ClipboardList },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Give Feedback', path: '/about', icon: Info }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
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
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50"
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
          {/* Header - Clean like reference */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(true)}
                className="h-10 w-10 rounded-full"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                <span className="font-medium text-sm">Study AI</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle in Header */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              
              {currentUser ? (
                <Link to="/profile">
                  <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50">
                    <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => navigate('/login')}
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {showChat && currentChatId ? (
              <Chat chatId={currentChatId} onChatUpdated={() => {}} />
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div className="flex-1 px-6 py-10">
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center">
                      <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">
                        {getGreeting()}{currentUser?.displayName ? ` ${currentUser.displayName.split(' ')[0]}` : ''}
                      </h1>
                      <p className="mt-3 text-base sm:text-lg text-muted-foreground">
                        How can Study AI assist you today?
                      </p>
                    </div>

                    <section className="mt-10">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">Examples</h2>
                        <Link
                          to="/study-planner"
                          className="text-sm font-medium text-primary story-link"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Study Timer
                          </span>
                        </Link>
                      </div>

                      <div className="mt-4 space-y-3">
                        {examples.map((ex) => (
                          <button
                            key={ex.text}
                            type="button"
                            className="w-full text-left rounded-xl border border-border bg-secondary/30 px-4 py-3 hover:bg-secondary/40"
                            onClick={() => {
                              setInputMessage(ex.text);
                              requestAnimationFrame(() => inputRef.current?.focus());
                            }}
                          >
                            <span className="flex items-center gap-3">
                              <ex.icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">{ex.text}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="mt-10">
                      <div className="grid grid-cols-2 gap-4">
                        {homeTiles.map((tile) => (
                          <Link key={tile.path} to={tile.path}>
                            <div className="h-20 rounded-xl border border-border bg-card hover:bg-secondary/30 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <tile.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">{tile.label}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <p className="mt-8 text-center text-xs text-muted-foreground">
                        Study AI can make mistakes. Consider checking important information.
                      </p>
                    </section>
                  </div>
                </div>

                {/* Input Box */}
                <div className="p-4 pb-6 border-t border-border">
                  <div className="max-w-2xl mx-auto">
                    <div className="relative flex items-center bg-background rounded-full border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full ml-1 text-muted-foreground"
                        onClick={() => {
                          setInputMessage('');
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                      <Input
                        ref={inputRef}
                        placeholder="Ask anything"
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
          </main>
        </div>

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
