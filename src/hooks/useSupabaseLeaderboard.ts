import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseLeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  balance: number;
}

export const useSupabaseLeaderboard = (currentUserId?: string) => {
  const [users, setUsers] = useState<SupabaseLeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<SupabaseLeaderboardUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('leaderboard', {
        body: { limit: 100 }
      });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setIsLoading(false);
        return;
      }

      if (data?.leaderboard) {
        setUsers(data.leaderboard);
        
        // Find current user's data
        if (currentUserId) {
          const userData = data.leaderboard.find((user: SupabaseLeaderboardUser) => user.id === currentUserId);
          if (userData) {
            setCurrentUserData(userData);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
      setIsLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get top 3 users for the podium
  const topUsers = users.slice(0, 3);

  return {
    users: filteredUsers,
    isLoading,
    currentUserData,
    searchQuery,
    setSearchQuery,
    topUsers,
    refreshLeaderboard: fetchLeaderboard,
  };
};
