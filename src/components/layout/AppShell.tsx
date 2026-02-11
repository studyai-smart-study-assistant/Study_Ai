
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { prefetchRoutes } from '@/lib/route-prefetch';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/providers/ThemeProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
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
  ClipboardList,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

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

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const { avatarUrl: profileAvatarUrl } = useAvatarUrl(currentUser?.uid);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Prefetch routes on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchRoutes();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNewChat = () => {
    navigate('/', { state: { newChat: true } });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">Study AI</span>
          </Link>
          {isMobile && (
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          )}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDesktopSidebarOpen(false)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3 flex-shrink-0">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          variant="secondary"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        {/* Features Section */}
        <div className="space-y-0.5 mb-4">
          <p className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">Features</p>
          {featureItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === item.path
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Navigation Section */}
        <div className="space-y-0.5 mb-4">
          <p className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">Navigation</p>
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === item.path
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Bottom Items */}
        <div className="space-y-0.5 pb-4">
          {bottomItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === item.path
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-2 flex-shrink-0">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground h-10"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button>

        {currentUser ? (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {currentUser.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{currentUser.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-10"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button className="w-full">Login / Register</Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && desktopSidebarOpen && (
        <aside className="w-72 border-r border-border bg-background flex-shrink-0 hidden md:flex">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-background border-r border-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            {/* Menu / Sidebar toggle */}
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-10 w-10 rounded-full"
              >
                <Menu className="h-5 w-5" />
              </Button>
            ) : !desktopSidebarOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDesktopSidebarOpen(true)}
                className="h-10 w-10 rounded-full"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            ) : null}
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
              <span className="font-medium text-sm text-foreground">Study AI</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* New Chat shortcut */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleNewChat}
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {/* Profile / Login */}
            {currentUser ? (
              <Link to="/profile">
                <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow">
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

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
