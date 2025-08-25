
import React from 'react';
import { LeaderboardUser } from '@/lib/leaderboard';
import TopUsersDisplay from './TopUsersDisplay';
import UserStatsPanel from './UserStatsPanel';
import RankInfoCard from './RankInfoCard';

interface LeaderboardSidePanelProps {
  topUsers: LeaderboardUser[];
  currentUserData: LeaderboardUser | null;
  isLoggedIn: boolean;
}

const LeaderboardSidePanel: React.FC<LeaderboardSidePanelProps> = ({ 
  topUsers, 
  currentUserData, 
  isLoggedIn 
}) => {
  return (
    <div className="w-full lg:w-1/4 space-y-6">
      <TopUsersDisplay topUsers={topUsers} />
      <UserStatsPanel currentUserData={currentUserData} isLoggedIn={isLoggedIn} />
      <RankInfoCard />
    </div>
  );
};

export default LeaderboardSidePanel;
