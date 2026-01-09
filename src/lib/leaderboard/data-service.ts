
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardUser } from './types';
import { generateBadges } from './badge-service';
import { getLastActiveText } from './utils';
import { getAllUsersUsage, formatUsageTime } from '@/utils/realTimeUsageTracker';

// Get leaderboard data from Supabase
export const getLeaderboardData = async (): Promise<LeaderboardUser[]> => {
  try {
    // Get all user points with profiles
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('user_id, balance, xp, level')
      .order('xp', { ascending: false });
    
    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
      return [];
    }

    if (!pointsData || pointsData.length === 0) {
      return [];
    }

    // Get profiles for all users
    const userIds = pointsData.map(p => p.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, current_streak, longest_streak, last_login')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get real usage time
    const allUsersUsage = await getAllUsersUsage();

    // Transform to LeaderboardUser format
    const transformedUsers: LeaderboardUser[] = pointsData.map((userData, index) => {
      const profile = profileMap.get(userData.user_id);
      const userUsage = allUsersUsage[userData.user_id];
      const actualStudyMinutes = userUsage?.totalMinutes || 0;
      const studyHours = Math.floor(actualStudyMinutes / 60);

      const streakDays = profile?.current_streak || 0;
      const longestStreak = profile?.longest_streak || 0;

      const lastLoginTime = profile?.last_login ? new Date(profile.last_login).getTime() : Date.now();
      const lastActive = getLastActiveText(lastLoginTime);

      // Create badges based on achievements
      const badges = generateBadges({
        points: userData.xp || 0,
        level: userData.level || 1,
        currentStreak: streakDays,
        longestStreak: longestStreak
      });

      return {
        id: userData.user_id,
        name: profile?.display_name || `User_${userData.user_id.substring(0, 5)}`,
        avatar: profile?.avatar_url || undefined,
        rank: index + 1,
        xp: userData.xp || 0,
        streakDays,
        studyHours,
        level: userData.level || 1,
        badges,
        lastActive,
        usageMinutes: actualStudyMinutes,
        sessionsCount: userUsage?.sessionsCount || 0,
        isActive: userUsage?.isActive || false
      };
    });

    console.log('📊 Leaderboard from Supabase:', transformedUsers.slice(0, 3));
    
    return transformedUsers;
  } catch (error) {
    console.error("Error getting leaderboard data:", error);
    return [];
  }
};

// Real-time leaderboard data listener using Supabase realtime
export const observeLeaderboardData = (callback: (data: LeaderboardUser[]) => void): (() => void) => {
  // Initial fetch
  getLeaderboardData().then(callback);

  // Subscribe to changes on user_points table
  const channel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_points'
      },
      async () => {
        // Re-fetch leaderboard data on any change
        const data = await getLeaderboardData();
        callback(data);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles'
      },
      async () => {
        // Re-fetch leaderboard data on profile change
        const data = await getLeaderboardData();
        callback(data);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};
