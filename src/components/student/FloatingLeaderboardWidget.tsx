
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp, X, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { observeLeaderboardData } from '@/lib/supabase/chat-functions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface FloatingLeaderboardWidgetProps { currentUserId: string; }

const FloatingLeaderboardWidget: React.FC<FloatingLeaderboardWidgetProps> = ({ currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const { language } = useLanguage();
  
  useEffect(() => {
    const unsubscribe = observeLeaderboardData(10, (data) => {
      setLeaderboardData(data);
      setIsLoading(false);
      const userInfo = data.find(u => u.id === currentUserId);
      if (userInfo) setUserRank(userInfo.rank);
    });
    return () => unsubscribe();
  }, [currentUserId]);
  
  const getRankEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
  
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-2">
            <Card className="w-64 shadow-lg border-purple-200">
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-3"><h3 className="font-semibold flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-500" />{language === 'hi' ? 'टॉप छात्र' : 'Top Students'}</h3><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button></div>
                {isLoading ? <div className="flex justify-center py-4"><div className="h-5 w-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div> : (
                  <div className="space-y-2">
                    {leaderboardData.slice(0, 5).map((user) => (
                      <div key={user.id} className={cn("flex items-center gap-2 p-1.5 rounded-md", user.id === currentUserId && "bg-purple-50")}>
                        <span className="font-medium w-5 text-center">{getRankEmoji(user.rank)}</span>
                        <Avatar className="h-7 w-7"><AvatarImage src={user.photoURL} /><AvatarFallback className="text-xs">{user.name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user.name}</p><Badge variant="secondary" className="text-xs">{user.points} pts</Badge></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Trophy className="h-4 w-4" /><span className="text-sm font-medium">{language === 'hi' ? 'लीडरबोर्ड' : 'Leaderboard'}</span>{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </motion.button>
    </div>
  );
};

export default FloatingLeaderboardWidget;
