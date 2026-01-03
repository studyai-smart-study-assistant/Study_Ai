
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "@/providers/ThemeProvider";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sparkles, 
  Home, 
  History, 
  Bookmark, 
  MessageSquare, 
  MessageCircle,
  GraduationCap,
  Send,
  Trophy,
  User,
  Info,
  Settings, 
  LogOut,
  Wallet,
  Moon, 
  Sun,
  Users,
  Youtube
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose 
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { BannerAd } from '@/components/ads';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { avatarUrl: profileAvatarUrl } = useAvatarUrl(currentUser?.uid);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/',
      description: 'मुख्य पृष्ठ'
    },
    { 
      icon: Youtube, 
      label: 'Study Tube', 
      path: '/study-tube',
      description: 'वीडियो देखें'
    },
    { 
      icon: History, 
      label: 'History', 
      path: '/chat-history',
      description: 'चैट इतिहास'
    },
    { 
      icon: Bookmark, 
      label: 'Saved', 
      path: '/saved-messages',
      description: 'सेव किए गए संदेश'
    },
    { 
      icon: GraduationCap, 
      label: 'Activities', 
      path: '/student-activities',
      description: 'गतिविधियां'
    },
    { 
      icon: Send, 
      label: 'Ask Teacher', 
      path: '/teacher-chats',
      description: 'शिक्षक से पूछें'
    },
    { 
      icon: Trophy, 
      label: 'Leaderboard', 
      path: '/leaderboard',
      description: 'लीडरबोर्ड'
    },
    { 
      icon: Wallet, 
      label: 'Points Wallet', 
      path: '/points-wallet',
      description: 'पॉइंट्स वॉलेट'
    },
    { 
      icon: User, 
      label: 'Profile', 
      path: '/profile',
      description: 'प्रोफाइल'
    },
    { 
      icon: Info, 
      label: 'About', 
      path: '/about',
      description: 'हमारे बारे में'
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-0">
        <SheetHeader className="space-y-3 pt-6 pb-4 px-6 border-b border-gray-100 dark:border-gray-800">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <SheetTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Study AI
            </SheetTitle>
          </Link>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="py-4 space-y-2 px-4">
            {menuItems.map((item) => (
              <Link 
                key={item.label}
                to={item.path}
                className={cn(
                  "flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                  location.pathname === item.path 
                    ? "bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 shadow-md border border-purple-200 dark:border-purple-800" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                )}
                onClick={isMobile ? onClose : undefined}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  location.pathname === item.path 
                    ? "bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300" 
                    : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Students Community Section */}
          <div className="px-6 py-6 mx-4 my-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">Students Community</h3>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-4 leading-relaxed">
              Connect with other students on the leaderboard and share your learning journey!
            </p>
            <Button 
              asChild
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Link to="/leaderboard" onClick={isMobile ? onClose : undefined}>
                <Trophy className="w-4 h-4 mr-2" />
                View Leaderboard
              </Link>
            </Button>
          </div>
          
          {/* Banner Ad removed from Sidebar to avoid conflicts and ensure ads render reliably per-page */}
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {currentUser && (
              <Link to="/profile" className="flex items-center space-x-3" onClick={isMobile ? onClose : undefined}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profileAvatarUrl || currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} className="object-cover object-[center_60%]" />
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-medium">
                    {currentUser.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {currentUser.displayName || "User"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </Link>
            )}
          </div>
          
          {currentUser ? (
            <Button 
              variant="outline" 
              className="w-full justify-start space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </Button>
          ) : (
            <SheetClose asChild>
              <Link to="/login">
                <Button variant="outline" className="w-full justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700">
                  Login
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
