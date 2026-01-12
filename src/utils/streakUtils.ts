
import { supabase } from '@/integrations/supabase/client';
import { getUserTimezone, getTodayDateString, getYesterdayDateString } from './timezoneUtils';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  lastUpdateTimestamp: number;
  timezone?: string;
}

export const getStreakKey = (userId: string) => `${userId}_login_streak_data`;

export const getStreakData = async (userId: string): Promise<StreakData> => {
  try {
    const userTimezone = getUserTimezone();
    console.log('🔄 Getting streak data for user:', userId, 'in timezone:', userTimezone);
    
    // Get from Supabase profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_login')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profile) {
      const streakData: StreakData = {
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastLoginDate: profile.last_login ? new Date(profile.last_login).toISOString().split('T')[0] : '',
        lastUpdateTimestamp: profile.last_login ? new Date(profile.last_login).getTime() : 0,
        timezone: userTimezone
      };
      
      // Also update localStorage for offline access
      const key = getStreakKey(userId);
      localStorage.setItem(key, JSON.stringify(streakData));
      return streakData;
    }
  } catch (error) {
    console.error('❌ Error getting streak data from Supabase:', error);
  }
  
  // Fallback to localStorage
  const key = getStreakKey(userId);
  const data = localStorage.getItem(key);
  
  if (data) {
    try {
      const parsedData = JSON.parse(data);
      return parsedData;
    } catch (error) {
      console.error('❌ Error parsing streak data:', error);
    }
  }
  
  const userTimezone = getUserTimezone();
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: '',
    lastUpdateTimestamp: 0,
    timezone: userTimezone
  };
};

export const saveStreakData = async (userId: string, data: StreakData): Promise<void> => {
  const userTimezone = getUserTimezone();
  const dataWithTimezone = { ...data, timezone: userTimezone };
  
  try {
    // Save to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        current_streak: dataWithTimezone.currentStreak,
        longest_streak: dataWithTimezone.longestStreak,
        last_login: new Date(dataWithTimezone.lastUpdateTimestamp).toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('❌ Error saving streak data to Supabase:', error);
  }
  
  // Also save to localStorage as backup
  const key = getStreakKey(userId);
  localStorage.setItem(key, JSON.stringify(dataWithTimezone));
  
  // Update legacy keys for backward compatibility
  localStorage.setItem(`${userId}_login_streak`, dataWithTimezone.currentStreak.toString());
  localStorage.setItem(`${userId}_longest_streak`, dataWithTimezone.longestStreak.toString());
  localStorage.setItem(`${userId}_last_login`, dataWithTimezone.lastLoginDate);
};

export const updateDailyStreak = async (userId: string): Promise<{ streakUpdated: boolean; newStreak: number; bonusPoints: number }> => {
  const userTimezone = getUserTimezone();
  const todayDateString = getTodayDateString(userTimezone);
  
  const streakData = await getStreakData(userId);
  
  // Check if already logged in today
  if (streakData.lastLoginDate === todayDateString) {
    return {
      streakUpdated: false,
      newStreak: streakData.currentStreak,
      bonusPoints: 0
    };
  }
  
  // Calculate yesterday's date in user's timezone
  const yesterdayDateString = getYesterdayDateString(userTimezone);
  
  let newStreak = 1;
  let bonusPoints = 5; // Base login bonus
  
  // Check if user logged in yesterday (consecutive day)
  if (streakData.lastLoginDate === yesterdayDateString) {
    newStreak = streakData.currentStreak + 1;
    
    // Add streak bonuses
    if (newStreak % 7 === 0) {
      bonusPoints += 15; // Weekly streak bonus
    } else if (newStreak % 3 === 0) {
      bonusPoints += 10; // 3-day streak bonus
    }
  }
  
  // Update longest streak if needed
  const newLongestStreak = Math.max(newStreak, streakData.longestStreak);
  
  // Save updated data
  const updatedData: StreakData = {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastLoginDate: todayDateString,
    lastUpdateTimestamp: Date.now(),
    timezone: userTimezone
  };
  
  await saveStreakData(userId, updatedData);
  
  return {
    streakUpdated: true,
    newStreak,
    bonusPoints
  };
};

// Synchronous functions for immediate access from localStorage (fallback only)
export const getCurrentStreakSync = (userId: string): number => {
  const key = getStreakKey(userId);
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.currentStreak || 0;
    } catch (error) {
      console.error('Error parsing streak data:', error);
    }
  }
  return 0;
};

export const getLongestStreakSync = (userId: string): number => {
  const key = getStreakKey(userId);
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.longestStreak || 0;
    } catch (error) {
      console.error('Error parsing streak data:', error);
    }
  }
  return 0;
};

export const getCurrentStreak = async (userId: string): Promise<number> => {
  const data = await getStreakData(userId);
  return data.currentStreak;
};

export const getLongestStreak = async (userId: string): Promise<number> => {
  const data = await getStreakData(userId);
  return data.longestStreak;
};
