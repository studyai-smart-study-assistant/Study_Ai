
import { database } from '../firebase/config';
import { ref, get, onValue } from 'firebase/database';
import { LeaderboardUser } from './types';
import { generateBadges } from './badge-service';
import { getLastActiveText } from './utils';
import { getAllUsersUsage, formatUsageTime } from '@/utils/realTimeUsageTracker';
import { supabase } from '@/integrations/supabase/client';

// Get user avatar from Supabase
const getUserAvatar = async (userId: string): Promise<string | undefined> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user avatar:', error);
      return undefined;
    }

    return data?.avatar_url || undefined;
  } catch (error) {
    console.error('Error in getUserAvatar:', error);
    return undefined;
  }
};

// Convert Firebase user data to LeaderboardUser format
const transformUserData = async (userId: string, userData: any, rank: number): Promise<LeaderboardUser> => {
  // Get streak data directly from Firebase - this is now the primary source
  const streakDays = userData.currentStreak || 0;
  const longestStreak = userData.longestStreak || 0;

  console.log(`🔥 Transform user ${userData.displayName}: currentStreak=${userData.currentStreak}, longestStreak=${userData.longestStreak}`);

  // Get real usage time from Firebase instead of calculating from points
  const allUsersUsage = await getAllUsersUsage();
  const userUsage = allUsersUsage[userId];
  const actualStudyMinutes = userUsage?.totalMinutes || 0;
  const studyHours = Math.floor(actualStudyMinutes / 60);

  console.log(`⏰ User ${userData.displayName}: Real usage time=${actualStudyMinutes} minutes (${studyHours} hours)`);

  // Get recent activity timestamp
  const lastLoginTime = userData.lastLogin || userData.createdAt || Date.now();
  const lastActive = getLastActiveText(lastLoginTime);

  // Create badges based on achievements - returns string array
  const badges = generateBadges(userData);

  // Get avatar from Supabase profiles
  const avatarUrl = await getUserAvatar(userId);

  return {
    id: userId,
    name: userData.displayName || userData.name || `User_${userId.substring(0, 5)}`,
    avatar: avatarUrl || userData.photoURL || undefined,
    rank,
    xp: userData.points || 0,
    streakDays, // Now from Firebase
    studyHours, // Now from real usage tracking
    level: userData.level || 1,
    badges, // Now correct string array type
    lastActive,
    // Add usage details for competition
    usageMinutes: actualStudyMinutes,
    sessionsCount: userUsage?.sessionsCount || 0,
    isActive: userUsage?.isActive || false
  };
};

// Get leaderboard data from Firebase with real usage time
export const getLeaderboardData = async (): Promise<LeaderboardUser[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const users: any[] = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      users.push({
        id: childSnapshot.key,
        ...userData
      });
    });
    
    // Sort by points (and then by level if points are equal)
    users.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.level - a.level;
    });
    
    // Transform to LeaderboardUser format with ranks and real usage time
    const transformedUsers = await Promise.all(
      users.map((user, index) => transformUserData(user.id, user, index + 1))
    );
    
    console.log('📊 Leaderboard with real usage time:', transformedUsers.slice(0, 3));
    
    return transformedUsers;
  } catch (error) {
    console.error("Error getting leaderboard data:", error);
    return [];
  }
};

// Real-time leaderboard data listener with usage time
export const observeLeaderboardData = (callback: (data: LeaderboardUser[]) => void): (() => void) => {
  const usersRef = ref(database, 'users');
  
  const listener = onValue(usersRef, async (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const users: any[] = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      users.push({
        id: childSnapshot.key,
        ...userData
      });
    });
    
    // Sort by points (and then by level if points are equal)
    users.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.level - a.level;
    });
    
    // Transform to LeaderboardUser format with ranks and real usage time
    const transformedUsers = await Promise.all(
      users.map((user, index) => transformUserData(user.id, user, index + 1))
    );
    
    console.log('📊 Real-time leaderboard with real usage time:', transformedUsers.slice(0, 3));
    
    callback(transformedUsers);
  });
  
  return () => {
    // Return unsubscribe function
    listener();
  };
};
