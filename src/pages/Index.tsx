
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Chat from '@/components/Chat';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useChatInitialization } from '@/hooks/home/useChatInitialization';
import { useHomeEffects } from '@/hooks/home/useHomeEffects';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Menu, Plus, Sparkles, FileText, BookOpen, GraduationCap, Trophy, Clock,
  Bookmark, User, LogOut, Moon, Sun, MessageSquare, MessageCircle, Youtube, Wallet, Info,
  X, ArrowUp, ClipboardList, LogIn
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';
import PageMeta from '@/components/seo/PageMeta';
import HighPerformanceAd from '@/components/ads/HighPerformanceAd';

const rotatingTexts = [
    "Unlock All Features! 🚀",
    "See Your Rank on the Leaderboard! 🏆",
    "Save Your Notes & Quizzes! 📚",
    "Join for FREE & Get a Bonus! ✨",
  ];
  
  const GetStartedBanner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const bannerRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % rotatingTexts.length);
      }, 8000);
      return () => clearInterval(interval);
    }, []);
  
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!bannerRef.current) return;
      const { clientX, clientY, currentTarget } = e;
      const { left, top, width, height } = currentTarget.getBoundingClientRect();
      const x = (clientX - left) / width - 0.5;
      const y = (clientY - top) / height - 0.5;
      bannerRef.current.style.transform = `perspective(1000px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) scale3d(1.03, 1.03, 1.03)`;
    };
  
    const handleMouseLeave = () => {
      if (bannerRef.current) {
        bannerRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      }
    };
  
    return (
      <div
        ref={bannerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="animated-gradient text-primary-foreground py-3 text-center shadow-2xl transition-transform duration-300 ease-out"
        style={{ willChange: 'transform' }}
      >
        <Link
          to="/login"
          className="flex items-center justify-center gap-3"
        >
          <Sparkles size={20} />
          <span className="text-lg font-bold text-shadow-hero banner-text-enter">
            {rotatingTexts[currentIndex]}
          </span>
          <span className="text-sm font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity">
            Click to Login
          </span>
        </Link>
      </div>
    );
  };

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
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

  useEffect(() => {
    if (!currentUser && !authLoading) {
      const timer = setTimeout(() => {
        setShowSignupPrompt(true);
      }, 300000); 
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
  };

  const handleFeatureClick = (path: string) => {
    if (!currentUser) {
      toast.info('Please log in to use this feature.', {
        action: { label: 'Login', onClick: () => navigate('/login') },
      });
    } else {
      navigate(path);
    }
  };

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
    { icon: MessageCircle, label: 'Campus Talk', path: '/chat-system' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Points Wallet', path: '/points-wallet' },
    { icon: GraduationCap, label: 'Activities', path: '/student-activities' },
  ];

  const bottomItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Info, label: 'About', path: '/about' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ErrorBoundary>
      <PageMeta
        title="StudyAI: Your Personal AI Study Assistant for Notes, Quizzes & Homework"
        description="Supercharge your learning with StudyAI! Get instant AI-powered help with homework, generate notes from any topic, create practice quizzes, and get guidance from an interactive AI teacher. Boost your grades and study smarter, not harder."
        canonicalPath="/"
        keywords="AI study assistant, notes generator, quiz maker, homework helper, study planner, AI teacher, student tools, exam preparation, learning assistant, education AI"
      />
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        {!currentUser && <GetStartedBanner />}
        <div className="flex flex-1 overflow-hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-72 p-0 bg-background border-r border-border">
              <div className="flex flex-col h-full">
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
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-muted-foreground px-3 py-2">FEATURES</p>
                    {featureItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { handleFeatureClick(item.path); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left",
                          location.pathname === item.path 
                            ? "bg-secondary text-foreground" 
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
  
                  <Separator className="my-3" />
  
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-medium text-muted-foreground px-3 py-2">NAVIGATION</p>
                    {navigationItems.map((item) => (
                       <button
                        key={item.label}
                        onClick={() => { handleFeatureClick(item.path); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left",
                          location.pathname === item.path 
                            ? "bg-secondary text-foreground" 
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
  
                  <Separator className="my-3" />
  
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
  
                <div className="p-3 border-t border-border space-y-2">
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
                    <div className="flex items-center gap-2">
                      <Link to="/login" className="flex-1" onClick={() => setIsSidebarOpen(false)}>
                          <Button className="w-full">Login</Button>
                      </Link>
                      <Link to="/signup" className="flex-1" onClick={() => setIsSidebarOpen(false)}>
                          <Button variant="outline" className="w-full">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
  
          <div className="flex-1 flex flex-col h-full overflow-hidden">
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
                {currentChatId && (
                  <button
                    onClick={handleNewChat}
                    title="New Chat"
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary active:scale-90 transition-all duration-150"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                )}
  
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
                  <div className="hidden sm:flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                      <Button size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
                  </div>
                )}
              </div>
            </header>
  
            <main className="flex-1 flex flex-col overflow-y-auto relative">
              {currentChatId ? (
                <Chat chatId={currentChatId} onChatUpdated={() => {}} />
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  <ScrollArea className="flex-1">
                    <div className="flex flex-col items-center justify-center px-4 pt-10 pb-32 max-w-2xl mx-auto w-full">
                      <div className="text-center mb-8">
                        <p className="text-muted-foreground text-sm mb-1">
                          {getGreeting()}{currentUser?.displayName ? `, ${currentUser.displayName.split(' ')[0]}` : ''} 👋
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <h1 className="text-xl font-semibold text-foreground">StudyAI</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Smart AI Learning Assistant</p>
                      </div>
  
                      <div className="grid grid-cols-2 gap-3 w-full mb-8">
                        <button onClick={() => handleFeatureClick('/notes-creator')} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors">
                            <FileText className="w-5 h-5 text-primary" />
                            <div className='text-left'>
                                <span className="text-sm font-medium">Notes Generator</span>
                                {!currentUser && <span className="text-xs text-primary block">Login Required</span>}
                            </div>
                        </button>
                        <button onClick={() => handleFeatureClick('/quiz-generator')} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <div className='text-left'>
                                <span className="text-sm font-medium">Quiz Generator</span>
                                {!currentUser && <span className="text-xs text-primary block">Login Required</span>}
                            </div>
                        </button>
                        <button onClick={() => handleFeatureClick('/teacher-chats')} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            <div className='text-left'>
                                <span className="text-sm font-medium">AI Teacher</span>
                                {!currentUser && <span className="text-xs text-primary block">Login Required</span>}
                            </div>
                        </button>
                        <button onClick={() => handleFeatureClick('/leaderboard')} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors">
                            <Trophy className="w-5 h-5 text-primary" />
                            <div className='text-left'>
                                <span className="text-sm font-medium">View Your Rank</span>
                                {!currentUser && <span className="text-xs text-primary block">Login Required</span>}
                            </div>
                        </button>
                      </div>
  
                      <HighPerformanceAd />
  
                      <div className="w-full space-y-2 mb-6">
                        <p className="text-xs text-muted-foreground font-medium px-1">Try these:</p>
                        {[
                          { text: "Create notes on any topic", path: "/notes-creator" },
                          { text: "Generate a quiz on any subject", path: "/quiz-generator" },
                          { text: "Get advice from AI Teacher", path: "/teacher-chats" },
                          { text: "Ask me anything — Math, Science, History...", path: null }
                        ].map((item) => (
                          <button
                            key={item.text}
                            onClick={() => {
                              if (item.path) {
                                handleFeatureClick(item.path);
                              } else {
                                setInputMessage(item.text);
                                inputRef.current?.focus();
                              }
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {item.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
  
                  <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
                    <div className="max-w-2xl mx-auto">
                      <div className="relative flex items-center bg-card rounded-full border border-border shadow-elegant">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full ml-1 text-muted-foreground"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        <Input
                          ref={inputRef}
                          placeholder="Ask anything..."
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
        </div>
      </div>
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </ErrorBoundary>
  );
};

export default Index;
