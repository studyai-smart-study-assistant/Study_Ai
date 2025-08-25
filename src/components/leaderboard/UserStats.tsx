
import React from 'react';
import { Star, Flame, Clock, Sparkles } from 'lucide-react';

interface UserStatsProps {
  xp: number;
  level: number;
  streakDays: number;
  studyHours: number;
}

const UserStats: React.FC<UserStatsProps> = ({ 
  xp, 
  level, 
  streakDays, 
  studyHours 
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-medium">स्टैट्स</h3>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold">{xp.toLocaleString()} XP</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span>लेवल {level}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            <Flame className="h-3 w-3 text-red-500" />
            <span className="ml-0.5">{streakDays} दिन</span>
          </div>
          <div className="flex items-center ml-2">
            <Clock className="h-3 w-3 text-blue-500" />
            <span className="ml-0.5">{studyHours} घंटे</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserStats;
