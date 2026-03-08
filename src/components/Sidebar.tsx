
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from "@/providers/ThemeProvider";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sparkles, Plus, History, Bookmark, MessageCircle,
  GraduationCap, Send, Trophy, User, Info,
  LogOut, Wallet, Moon, Sun, Youtube,
  FileText, Brain, BookOpen, CalendarDays, PenTool,
  ChevronRight, MessageSquare
} from 'lucide-react';
import { 
  Sheet, SheetContent, SheetClose 
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Chat history from localStorage
const getRecentChats = (): { id: string; title: string; time: number }[] => {
  try {
    const raw = localStorage.getItem('chat_sessions');
    if (!raw) return [];
    const sessions = JSON.parse(raw);
    return (Array.isArray(sessions) ? sessions : [])
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5)
      .map((s: any) => ({ id: s.id, title: s.title || 'New Chat', time: s.timestamp }));
  } catch {
    return [];
  }
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { avatarUrl: profileAvatarUrl } = useAvatarUrl(currentUser?.uid);
  const [recentChats, setRecentChats] = useState<{ id: string; title: string; time: number }[]>([]);

  useEffect(() => {
    if (isOpen) setRecentChats(getRecentChats());
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); onClose(); } catch {} finally { setIsLoggingOut(false); }
  };

  const close = isMobile ? onClose : undefined;

  const features = [
    { icon: FileText, label: 'Notes Creator', path: '/notes-creator' },
    { icon: Brain, label: 'Quiz Generator', path: '/quiz-generator' },
    { icon: Send, label: 'Ask Teacher', path: '/teacher-chats' },
    { icon: CalendarDays, label: 'Study Planner', path: '/study-planner' },
    { icon: PenTool, label: 'Homework Helper', path: '/homework-helper' },
    { icon: Youtube, label: 'Study Tube', path: '/study-tube' },
  ];

  const navigation = [
    { icon: History, label: 'Chat History', path: '/chat-history' },
    { icon: Bookmark, label: 'Saved', path: '/saved-messages' },
    { icon: MessageCircle, label: 'Campus Talk', path: '/chat-system' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Points Wallet', path: '/points-wallet' },
    { icon: GraduationCap, label: 'Activities', path: '/student-activities' },
  ];

  const bottom = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Info, label: 'About', path: '/about' },
  ];

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={close}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
          active
            ? "bg-primary/10 text-primary dark:bg-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-3 pt-4 pb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </span>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[272px] bg-background border-r border-border p-0 flex flex-col">
        
        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex items-center gap-2.5">
          <Link to="/" onClick={close} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-foreground">Study AI</span>
          </Link>
        </div>

        {/* New Chat button */}
        <div className="px-3 pb-2">
          <Link to="/" onClick={close}>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 rounded-lg text-xs font-medium border-dashed">
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </Link>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-1.5 pb-4">

            {/* Recent chats */}
            {recentChats.length > 0 && (
              <>
                <SectionLabel>Recent</SectionLabel>
                <div className="space-y-0.5 px-0.5">
                  {recentChats.map((chat) => (
                    <Link
                      key={chat.id}
                      to="/"
                      onClick={close}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-50" />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Features */}
            <SectionLabel>Features</SectionLabel>
            <div className="space-y-0.5 px-0.5">
              {features.map((item) => <NavItem key={item.path} {...item} />)}
            </div>

            {/* Navigation */}
            <SectionLabel>Navigation</SectionLabel>
            <div className="space-y-0.5 px-0.5">
              {navigation.map((item) => <NavItem key={item.path} {...item} />)}
            </div>

            {/* Divider */}
            <div className="mx-3 my-3 border-t border-border" />

            {/* Bottom items */}
            <div className="space-y-0.5 px-0.5">
              {bottom.map((item) => <NavItem key={item.path} {...item} />)}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            <span>Dark Mode</span>
          </button>

          {/* User / Login */}
          {currentUser ? (
            <div className="space-y-2">
              <Link to="/profile" onClick={close} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {currentUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{currentUser.displayName || "User"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{currentUser.email}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          ) : (
            <SheetClose asChild>
              <Link to="/login">
                <Button className="w-full h-9 text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg">
                  Login / Register
                </Button>
              </Link>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
