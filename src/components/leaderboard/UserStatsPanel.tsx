
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Trophy, Star, Flame, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { LeaderboardUser } from '@/lib/leaderboard';

interface UserStatsPanelProps {
  currentUserData: LeaderboardUser | null;
  isLoggedIn: boolean;
}

const UserStatsPanel: React.FC<UserStatsPanelProps> = ({ currentUserData, isLoggedIn }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <Award className="h-5 w-5 text-purple-500 mr-2" />
        आपकी स्थिति
      </h2>
      
      {isLoggedIn && currentUserData ? (
        <div className="space-y-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">वर्तमान रैंक</p>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">{currentUserData.rank}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="font-bold">{currentUserData.xp}</span>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">स्ट्रीक</p>
              <div className="flex items-center">
                <Flame className="h-3 w-3 text-red-500 mr-1" />
                <span className="font-bold">{currentUserData.streakDays}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">घंटे</p>
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-blue-500 mr-1" />
                <span className="font-bold">{currentUserData.studyHours}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">अगला रैंक तक</p>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full" 
                style={{ width: `${Math.min(100, (currentUserData.xp % 1000) / 10)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{currentUserData.xp} XP प्राप्त किए</span>
              <span>{Math.ceil(currentUserData.xp / 1000) * 1000} XP तक</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            अपनी रैंकिंग देखने के लिए लॉगिन करें
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            लॉगिन करें
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserStatsPanel;
