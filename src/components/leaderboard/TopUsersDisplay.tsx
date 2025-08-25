
import React from 'react';
import { Trophy, Clock, Flame, Star } from 'lucide-react';
import { LeaderboardUser } from '@/lib/leaderboard';
import { Badge } from '@/components/ui/badge';
import { getUserAppUsage, getFormattedUsageTime } from '@/utils/appUsageTracker';
import { getCurrentStreakSync } from '@/utils/streakUtils';
import UserAvatar from './UserAvatar';

interface TopUsersDisplayProps {
  topUsers: LeaderboardUser[];
}

const TopUsersDisplay: React.FC<TopUsersDisplayProps> = ({ topUsers }) => {
  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1: return 'h-32'; // First place - tallest
      case 2: return 'h-20'; // Second place - medium
      case 3: return 'h-16'; // Third place - shortest
      default: return 'h-12';
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-gradient-to-t from-yellow-400 to-yellow-300';
      case 2: return 'bg-gradient-to-t from-gray-400 to-gray-300';
      case 3: return 'bg-gradient-to-t from-amber-600 to-amber-500';
      default: return 'bg-gray-200';
    }
  };

  const getRankEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return position;
    }
  };

  const getUserInitials = (name: string): string => {
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
        टॉप लर्नर्स
      </h2>
      
      <div className="relative flex items-end justify-center h-48 mb-6">
        {topUsers.slice(0, 3).map((user, index) => {
          const position = index + 1;
          const userUsage = getUserAppUsage(user.id);
          const userStreak = getCurrentStreakSync(user.id);
          
          return (
            <div key={user.id} className="flex flex-col items-center mx-2">
              {/* Trophy for first place */}
              {position === 1 && (
                <Trophy className="h-6 w-6 text-yellow-500 mb-2" />
              )}
              
              {/* User Avatar with rank badge */}
              <div className="relative mb-2">
                <UserAvatar 
                  userId={user.id}
                  userName={user.name}
                  isCurrentUser={false}
                  avatarUrl={user.avatar}
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getPodiumColor(position)} border-2 border-white flex items-center justify-center text-xs font-bold`}>
                  {getRankEmoji(position)}
                </div>
              </div>
              
              {/* User Stats */}
              <div className="text-center mb-2 space-y-1">
                <p className="text-sm font-medium truncate max-w-20">{user.name}</p>
                
                {/* XP Points */}
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-medium">{user.xp}</span>
                </div>
                
                {/* Streak */}
                {userStreak > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-xs">{userStreak}</span>
                  </div>
                )}
                
                {/* App Usage Time */}
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span className="text-xs">{getFormattedUsageTime(userUsage.totalMinutes)}</span>
                </div>
              </div>
              
              {/* Podium */}
              <div className={`w-16 ${getPodiumHeight(position)} ${getPodiumColor(position)} rounded-t-lg border-2 border-white dark:border-gray-700 shadow-sm`}>
                <div className="h-full flex items-end justify-center pb-1">
                  <span className="text-xs font-bold text-gray-700">{position}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {topUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>अभी तक कोई टॉप लर्नर नहीं है</p>
        </div>
      )}
    </div>
  );
};

export default TopUsersDisplay;
