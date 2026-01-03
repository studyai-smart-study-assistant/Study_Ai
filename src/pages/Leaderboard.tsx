
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader';
import LeaderboardSidePanel from '@/components/leaderboard/LeaderboardSidePanel';
import { useSupabaseLeaderboard } from '@/hooks/useSupabaseLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Trophy, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BannerAd } from '@/components/ads';

const LeaderboardPage = () => {
  const { currentUser } = useAuth();
  const { 
    users,
    isLoading,
    currentUserData,
    searchQuery,
    setSearchQuery,
    topUsers
  } = useSupabaseLeaderboard(currentUser?.uid);
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 pb-16">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <LeaderboardHeader />
        
        {/* Banner Ad at top */}
        <div className="mb-4">
          <BannerAd className="mx-auto" />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Content */}
          <div className="flex-1 w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  लीडरबोर्ड रैंकिंग
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="खोजें..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {users.map((user) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            user.id === currentUser?.uid
                              ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-500'
                              : 'bg-card hover:bg-accent/50'
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8">
                              {getRankIcon(user.rank) || (
                                <span className="font-bold text-muted-foreground">
                                  #{user.rank}
                                </span>
                              )}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Level {user.level}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                              {user.xp.toLocaleString()} XP
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.balance} पॉइंट्स
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Side Panel */}
          <div className="lg:w-80 space-y-4">
            <LeaderboardSidePanel
              topUsers={topUsers.map(user => ({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                rank: user.rank,
                xp: user.xp,
                streakDays: 0,
                studyHours: 0,
                level: user.level,
                badges: [],
                lastActive: new Date().toISOString(),
              }))}
              currentUserData={currentUserData ? {
                id: currentUserData.id,
                name: currentUserData.name,
                avatar: currentUserData.avatar,
                rank: currentUserData.rank,
                xp: currentUserData.xp,
                streakDays: 0,
                studyHours: 0,
                level: currentUserData.level,
                badges: [],
                lastActive: new Date().toISOString(),
              } : null}
              isLoggedIn={!!currentUser}
            />
            
            {/* Banner Ad in sidebar */}
            <Card className="border border-dashed">
              <CardContent className="pt-4">
                <p className="text-xs text-center text-muted-foreground mb-2">प्रायोजित</p>
                <BannerAd className="mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
