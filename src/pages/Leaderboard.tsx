
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseLeaderboard } from '@/hooks/useSupabaseLeaderboard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, Medal, Award, ChevronLeft, Star, Flame, Clock, Sparkles, Crown, TrendingUp, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PageMeta from '@/components/seo/PageMeta';
import { useNavigate } from 'react-router-dom';
import { getCurrentStreakSync } from '@/utils/streakUtils';
import { getUserAppUsage, getFormattedUsageTime } from '@/utils/appUsageTracker';
import HighPerformanceAd from '@/components/ads/HighPerformanceAd';

const LeaderboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { 
    users,
    isLoading,
    currentUserData,
    searchQuery,
    setSearchQuery,
    topUsers
  } = useSupabaseLeaderboard(currentUser?.uid);
  
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg"><Trophy className="h-4 w-4 text-white" /></div>;
    if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md"><Medal className="h-4 w-4 text-white" /></div>;
    if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-md"><Award className="h-4 w-4 text-white" /></div>;
    return <span className="w-8 h-8 flex items-center justify-center font-bold text-muted-foreground">#{rank}</span>;
  };

  const getPodiumStyles = (position: number) => {
    switch (position) {
      case 1: return { height: 'h-24', bg: 'bg-gradient-to-t from-yellow-400 to-amber-300', ring: 'ring-yellow-400', order: 'order-2' };
      case 2: return { height: 'h-16', bg: 'bg-gradient-to-t from-slate-400 to-slate-300', ring: 'ring-slate-400', order: 'order-1' };
      case 3: return { height: 'h-12', bg: 'bg-gradient-to-t from-orange-500 to-amber-400', ring: 'ring-orange-400', order: 'order-3' };
      default: return { height: 'h-8', bg: 'bg-gray-300', ring: 'ring-gray-300', order: '' };
    }
  };

  const userStreak = currentUser?.uid ? getCurrentStreakSync(currentUser.uid) : 0;
  const userUsage = currentUser?.uid ? getUserAppUsage(currentUser.uid) : { totalMinutes: 0 };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950 pb-20">
      <PageMeta 
        title="Student Leaderboard - Top Learners & XP Rankings | StudyAI"
        description="See top students and their XP rankings. Compete with other learners, earn points, and climb the leaderboard. StudyAI gamified learning."
        canonicalPath="/leaderboard"
        keywords="Student Leaderboard, XP Rankings, Study Competition, Top Students, Learning Gamification"
      />
      
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-3 -ml-2" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            वापस जाएं
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">लीडरबोर्ड</h1>
              <p className="text-sm text-muted-foreground">
                Study AI के टॉप लर्नर्स
              </p>
            </div>
          </div>
        </div>

        {/* Main Ranking Card */}
        <Card className="mb-5 border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-4">
            <div className="flex items-center gap-2 text-white mb-3">
              <Crown className="h-5 w-5" />
              <span className="font-semibold">लीडरबोर्ड रैंकिंग</span>
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs">
                <Users className="h-3 w-3 mr-1" />
                {users.length} छात्र
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="नाम से खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
            </div>
          </div>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <ScrollArea className="h-[420px]">
                <div className="divide-y divide-border">
                  {users.map((user, index) => {
                    const isCurrentUser = user.id === currentUser?.uid;
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-3 p-4 transition-colors ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Rank */}
                        {getRankDisplay(user.rank)}
                        
                        {/* Avatar */}
                        <Avatar className={`h-11 w-11 border-2 ${isCurrentUser ? 'border-purple-400' : 'border-transparent'}`}>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Name & Level */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold truncate ${isCurrentUser ? 'text-purple-700 dark:text-purple-300' : ''}`}>
                              {user.name}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                आप
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Level {user.level}
                          </p>
                        </div>
                        
                        {/* XP */}
                        <div className="text-right">
                          <p className="font-bold text-purple-600 dark:text-purple-400">
                            {user.xp.toLocaleString()} XP
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {user.balance.toLocaleString()} पॉइंट्स
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        {topUsers.length >= 3 && (
          <Card className="mb-5 border-0 shadow-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-foreground">टॉप 3 लर्नर्स</span>
              </div>
              
              <div className="flex items-end justify-center gap-3 pb-2">
                {[topUsers[1], topUsers[0], topUsers[2]].map((user, idx) => {
                  if (!user) return null;
                  const position = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                  const styles = getPodiumStyles(position);
                  const userUsageData = getUserAppUsage(user.id);
                  
                  return (
                    <div key={user.id} className={`flex flex-col items-center ${styles.order}`}>
                      {position === 1 && <Crown className="h-6 w-6 text-yellow-500 mb-1 animate-pulse" />}
                      
                      <Avatar className={`h-14 w-14 mb-2 ring-2 ${styles.ring} ring-offset-2`}>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-lg font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <p className="text-sm font-semibold text-center truncate max-w-20">{user.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>{user.xp}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span>{getFormattedUsageTime(userUsageData.totalMinutes)}</span>
                      </div>
                      
                      {/* Podium */}
                      <div className={`w-20 ${styles.height} ${styles.bg} rounded-t-xl flex items-center justify-center shadow-inner`}>
                        <span className="text-white font-bold text-xl">{position}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Current User Stats */}
        <Card className="mb-5 border-0 shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-foreground">आपकी स्थिति</span>
            </div>
            
            {currentUser && currentUserData ? (
              <div className="space-y-4">
                {/* Current Rank */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">वर्तमान रैंक</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">#{currentUserData.rank}</p>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50">
                    <p className="text-xs text-muted-foreground mb-1">XP</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg">{currentUserData.xp}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                    <p className="text-xs text-muted-foreground mb-1">स्ट्रीक</p>
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-bold text-lg">{userStreak}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                    <p className="text-xs text-muted-foreground mb-1">घंटे</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-lg">{Math.round(userUsage.totalMinutes / 60)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress to next rank */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>अगला रैंक तक</span>
                  </div>
                  <Progress value={Math.min(100, (currentUserData.xp % 1000) / 10)} className="h-2.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currentUserData.xp} XP प्राप्त किए</span>
                    <span>{Math.ceil(currentUserData.xp / 1000) * 1000} XP तक</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-muted-foreground mb-4">अपनी रैंकिंग देखने के लिए लॉगिन करें</p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  लॉगिन करें
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* How Ranking Works */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-foreground">रैंकिंग कैसे काम करती है?</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Study AI पर अध्ययन करके, क्विज़ हल करके, और लगातार अध्ययन स्ट्रीक बनाए रखकर XP अर्जित करें। जितने अधिक XP, उतनी उच्च रैंकिंग!
            </p>
          </div>
        </Card>
        <HighPerformanceAd />
      </div>
    </div>
  );
};

export default LeaderboardPage;
