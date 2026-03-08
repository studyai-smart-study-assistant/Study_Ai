
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
  MessageSquare, MoreHorizontal, Trash2
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

const getRecentChats = (): { id: string; title: string; time: number }[] => {
  try {
    const raw = localStorage.getItem('chat_sessions');
    if (!raw) return [];
    const sessions = JSON.parse(raw);
    return (Array.isArray(sessions) ? sessions : [])
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 8)
      .map((s: any) => ({ id: s.id, title: s.title || 'New Chat', time: s.timestamp }));
  } catch {
    return [];
  }
};

const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
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
    { icon: Bookmark, label: 'Saved', path: '/saved-messages' },
    { icon: MessageCircle, label: 'Campus Talk', path: '/chat-system' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Points Wallet', path: '/points-wallet' },
    { icon: GraduationCap, label: 'Activities', path: '/student-activities' },
  ];

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={close}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group",
          active
            ? "bg-primary/10 text-primary dark:bg-primary/20 shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] flex-shrink-0 transition-colors", active && "text-primary")} />
        <span className="truncate">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
      </Link>
    );
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-3 pt-5 pb-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
        {children}
      </span>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] bg-background/95 backdrop-blur-xl border-r border-border/50 p-0 flex flex-col">
        
        {/* Header */}
        <div className="px-4 pt-5 pb-2 flex items-center gap-3">
          <Link to="/" onClick={close} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-foreground tracking-tight">Study AI</span>
              <p className="text-[9px] text-muted-foreground/60 font-medium -mt-0.5">Your learning companion</p>
            </div>
          </Link>
        </div>

        {/* New Chat button */}
        <div className="px-3 py-2">
          <Link to="/" onClick={close}>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2.5 h-10 rounded-xl text-[13px] font-semibold border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-2 pb-4">

            {/* Recent chats — ChatGPT/Gemini style */}
            {recentChats.length > 0 && (
              <>
                <SectionLabel>Recent Chats</SectionLabel>
                <div className="space-y-0.5 px-1">
                  {recentChats.map((chat) => (
                    <Link
                      key={chat.id}
                      to="/"
                      onClick={close}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-40 group-hover:opacity-70 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <span className="truncate block leading-tight">{chat.title}</span>
                        <span className="text-[10px] text-muted-foreground/50 block mt-0.5">{formatRelativeTime(chat.time)}</span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    to="/chat-history"
                    onClick={close}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-primary/70 hover:text-primary hover:bg-primary/5 transition-all font-medium"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>View all chats</span>
                  </Link>
                </div>
              </>
            )}

            {/* If no chats, show a prompt */}
            {recentChats.length === 0 && (
              <>
                <SectionLabel>Recent Chats</SectionLabel>
                <div className="mx-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2.5 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-[12px] font-medium text-muted-foreground/60">No chats yet</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
                    Start a new conversation to see your chat history here.
                  </p>
                </div>
              </>
            )}

            {/* Features */}
            <SectionLabel>Tools</SectionLabel>
            <div className="space-y-0.5 px-1">
              {features.map((item) => <NavItem key={item.path} {...item} />)}
            </div>

            {/* Navigation */}
            <SectionLabel>Explore</SectionLabel>
            <div className="space-y-0.5 px-1">
              {navigation.map((item) => <NavItem key={item.path} {...item} />)}
            </div>

            {/* Divider */}
            <div className="mx-4 my-3 border-t border-border/40" />

            {/* Bottom items — Profile, Chat History, About together */}
            <div className="space-y-0.5 px-1">
              <NavItem icon={User} label="Profile" path="/profile" />
              <NavItem icon={History} label="Chat History" path="/chat-history" />
              <NavItem icon={Info} label="About" path="/about" />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/40 p-3 space-y-2 bg-muted/20">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            <span className="font-medium">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>

          {/* User / Login */}
          {currentUser ? (
            <div className="space-y-1.5">
              <Link to="/profile" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-all">
                <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                  <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {currentUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground truncate">{currentUser.displayName || "User"}</div>
                  <div className="text-[10px] text-muted-foreground/60 truncate">{currentUser.email}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          ) : (
            <SheetClose asChild>
              <Link to="/login">
                <Button className="w-full h-10 text-[13px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all">
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
