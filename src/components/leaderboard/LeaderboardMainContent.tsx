
import React from 'react';
import { LeaderboardUser } from '@/lib/leaderboard';
import LeaderboardFilters from './LeaderboardFilters';
import LeaderboardList from './LeaderboardList';

interface LeaderboardMainContentProps {
  users: LeaderboardUser[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeFilter: 'all' | 'week' | 'month' | 'today';
  setTimeFilter: (filter: 'all' | 'week' | 'month' | 'today') => void;
  sortBy: 'xp' | 'streakDays' | 'studyHours';
  setSortBy: (sortBy: 'xp' | 'streakDays' | 'studyHours') => void;
  currentUserId?: string;
}

const LeaderboardMainContent: React.FC<LeaderboardMainContentProps> = ({
  users,
  isLoading,
  searchQuery,
  setSearchQuery,
  timeFilter,
  setTimeFilter,
  sortBy,
  setSortBy,
  currentUserId
}) => {
  return (
    <div className="w-full lg:w-3/4">
      <LeaderboardFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <LeaderboardList 
        users={users} 
        isLoading={isLoading} 
        currentUserId={currentUserId} 
      />
    </div>
  );
};

export default LeaderboardMainContent;
