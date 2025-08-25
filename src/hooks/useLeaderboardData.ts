
import { useState, useEffect } from 'react';
import { LeaderboardUser, observeLeaderboardData } from '@/lib/leaderboard';

export const useLeaderboardData = (currentUserId?: string) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'xp' | 'streakDays' | 'studyHours'>('xp');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'today'>('all');

  useEffect(() => {
    const unsubscribe = observeLeaderboardData((leaderboardData) => {
      setUsers(leaderboardData);
      
      // Find current user's data
      if (currentUserId) {
        const userData = leaderboardData.find(user => user.id === currentUserId);
        if (userData) {
          setCurrentUserData(userData);
        }
      }
      
      setIsLoading(false);
    });
    
    // Return cleanup function
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUserId, timeFilter]);

  // Sort the users based on the selected criteria
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'xp') return b.xp - a.xp;
    if (sortBy === 'streakDays') return b.streakDays - a.streakDays;
    return b.studyHours - a.studyHours;
  });
  
  // Filter users based on search query
  const filteredUsers = sortedUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get top 3 users for the podium
  const topUsers = sortedUsers.slice(0, 3);

  return {
    users: filteredUsers,
    isLoading,
    currentUserData,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    timeFilter,
    setTimeFilter,
    topUsers
  };
};
