
import React from 'react';
import { Users } from 'lucide-react';
import { LeaderboardUser } from '@/lib/leaderboard';
import LeaderboardCard from './LeaderboardCard';

interface LeaderboardListProps {
  users: LeaderboardUser[];
  isLoading: boolean;
  currentUserId?: string;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ users, isLoading, currentUserId }) => {
  return (
    <div className="space-y-1">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : users.length > 0 ? (
        users.map(user => (
          <LeaderboardCard 
            key={user.id} 
            user={user} 
            currentUserId={currentUserId} 
          />
        ))
      ) : (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg">
          <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-gray-500 dark:text-gray-400">कोई उपयोगकर्ता नहीं मिला</h3>
        </div>
      )}
    </div>
  );
};

export default LeaderboardList;
