
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardUser } from '@/lib/leaderboard';
import { formatUsageTime } from '@/utils/realTimeUsageTracker';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useChatNavigation } from '@/hooks/useChatNavigation';
import RankIcon from './RankIcon';
import UserAvatar from './UserAvatar';
import UserStats from './UserStats';
import UserBadges from './UserBadges';
import UserCardActions from './UserCardActions';

interface LeaderboardCardProps {
  user: LeaderboardUser;
  currentUserId?: string;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ user, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { startChatWithUserById } = useChatNavigation();
  const isCurrentUser = currentUserId === user.id;
  
  // Calculate display time including current session
  const getDisplayUsageTime = () => {
    let totalMinutes = user.usageMinutes || 0;
    
    // If user is active and has current session, show real-time update
    if (user.isActive && user.currentSessionDuration) {
      totalMinutes += user.currentSessionDuration;
    }
    
    return formatUsageTime(totalMinutes);
  };
  
  return (
    <div 
      className={`relative overflow-hidden transition-all duration-300 ${
        expanded ? 'mb-4' : 'mb-2'
      } ${
        isCurrentUser 
          ? 'border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20' 
          : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      } rounded-lg shadow-sm hover:shadow-md`}
    >
      {isCurrentUser && (
        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl">
          आप
        </div>
      )}
      
      <div className="flex items-center p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center">
          <RankIcon rank={user.rank} />
        </div>
        
          <UserAvatar 
            userId={user.id}
            userName={user.name}
            isCurrentUser={isCurrentUser}
            avatarUrl={user.avatar}
          />
        
        <div className="flex-1 ml-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{user.name}</h3>
            <div className="flex items-center gap-2">
              {!isCurrentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-primary hover:text-primary-foreground hover:bg-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    startChatWithUserById(user.id);
                  }}
                  title="चैट करें"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
              <span className="text-sm font-semibold">{user.xp.toLocaleString()} XP</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span>लेवल {user.level}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                <span className="ml-0.5">{user.streakDays} दिन</span>
              </div>
              <div className="flex items-center ml-2">
                <span className="ml-0.5 font-medium text-blue-600 dark:text-blue-400">
                  {getDisplayUsageTime()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <button className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700">
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <div className="font-medium text-blue-700 dark:text-blue-300">कुल सेशन</div>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">
                {user.sessionsCount || 0}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
              <div className="font-medium text-green-700 dark:text-green-300">सबसे लंबा सेशन</div>
              <div className="text-green-600 dark:text-green-400 font-semibold">
                {formatUsageTime(user.studyHours * 60)} {/* Convert back to minutes for display */}
              </div>
            </div>
          </div>
          
          <UserBadges badges={user.badges} />
          <UserCardActions isCurrentUser={isCurrentUser} lastActive={user.lastActive} />
        </div>
      )}
    </div>
  );
};

export default LeaderboardCard;
