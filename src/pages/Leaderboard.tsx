
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader';
import LeaderboardMainContent from '@/components/leaderboard/LeaderboardMainContent';
import LeaderboardSidePanel from '@/components/leaderboard/LeaderboardSidePanel';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';

const LeaderboardPage = () => {
  const { currentUser } = useAuth();
  const { 
    users,
    isLoading,
    currentUserData,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    timeFilter,
    setTimeFilter,
    topUsers
  } = useLeaderboardData(currentUser?.uid);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 pb-16">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <LeaderboardHeader />
        
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Content */}
          <LeaderboardMainContent
            users={users}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentUserId={currentUser?.uid}
          />
          
          {/* Side Panel */}
          <LeaderboardSidePanel
            topUsers={topUsers}
            currentUserData={currentUserData}
            isLoggedIn={!!currentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
