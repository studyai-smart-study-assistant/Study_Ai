
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp, X, Crown, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { observeLeaderboardData } from '@/lib/firebase/leaderboard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  level: number;
  photoURL?: string;
  rank: number;
  streak?: number;
  currentStreak?: number;
  longestStreak?: number;
}

interface FloatingLeaderboardWidgetProps {
  currentUserId: string;
}

const FloatingLeaderboardWidget: React.FC<FloatingLeaderboardWidgetProps> = ({ currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const { language } = useLanguage();
  
  useEffect(() => {
    console.log('🔄 Setting up leaderboard observer...');
    const unsubscribe = observeLeaderboardData(10, (data) => {
      console.log('📊 Leaderboard data received from Firebase:', data);
      
      // Process streak information - now only from Firebase
      const dataWithStreak = data.map(user => {
        // Use Firebase streak data directly
        const streakValue = user.currentStreak || user.streak || 0;
        
        console.log(`🔥 User ${user.name}: Firebase streak=${streakValue}, no localStorage fallback needed`);
        
        return {
          ...user,
          streak: streakValue
        };
      });
      
      setLeaderboardData(dataWithStreak);
      setIsLoading(false);
      
      // Find current user rank
      const userInfo = dataWithStreak.find(user => user.id === currentUserId);
      if (userInfo) {
        setUserRank(userInfo.rank);
        console.log(`👤 Current user rank: ${userInfo.rank}, streak: ${userInfo.streak}`);
      }
      
      console.log('✅ Leaderboard updated with Firebase streak data:', dataWithStreak.slice(0, 3));
    });
    
    return () => {
      console.log('🔄 Cleaning up leaderboard observer');
      unsubscribe();
    };
  }, [currentUserId]);
  
  const toggleOpen = () => setIsOpen(!isOpen);
  
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-700';
      default: return 'text-gray-500';
    }
  };
  
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2"
          >
            <Card className="w-64 shadow-lg border-purple-200 dark:border-purple-800">
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>{language === 'hi' ? 'टॉप छात्र' : 'Top Students'}</span>
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboardData.slice(0, 5).map((user) => (
                      <div 
                        key={user.id} 
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-md",
                          user.id === currentUserId && "bg-purple-50 dark:bg-purple-900/20"
                        )}
                      >
                        <span className={cn("font-medium w-5 text-center", getRankColor(user.rank))}>
                          {getRankEmoji(user.rank)}
                        </span>
                        <Avatar className="h-7 w-7">
                          {user.photoURL ? (
                            <AvatarImage src={user.photoURL} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {user.name || (language === 'hi' ? 'अज्ञात छात्र' : 'Unknown Student')}
                            </p>
                            {user.streak && user.streak > 0 && (
                              <Badge variant="outline" className="ml-1 px-1 h-5 bg-orange-100 border-orange-200">
                                <Flame className="h-3 w-3 text-orange-500 mr-0.5" />
                                <span className="text-[10px]">{user.streak}</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs px-1 h-4">
                              {user.points} {language === 'hi' ? 'अंक' : 'pts'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {userRank && userRank > 5 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <span className="font-medium w-5 text-center">
                        {userRank}
                      </span>
                      <span className="text-xs text-purple-600">
                        {language === 'hi' ? 'आप' : 'You'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {language === 'hi' ? 'अपने स्कोर में सुधार करें!' : 'Improve your score!'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        onClick={toggleOpen}
        className={cn(
          "flex items-center gap-1.5 text-white px-3 py-2 rounded-full shadow-lg",
          "bg-gradient-to-r from-purple-600 to-indigo-600",
          "hover:from-purple-700 hover:to-indigo-700 transition-all"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Trophy className="h-4 w-4" />
        <span className="text-sm font-medium">
          {language === 'hi' ? 'लीडरबोर्ड' : 'Leaderboard'}
        </span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </motion.button>
    </div>
  );
};

export default FloatingLeaderboardWidget;
