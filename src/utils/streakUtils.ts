
import { ref, set, get, update } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { getUserTimezone, getTodayDateString, getYesterdayDateString, getCurrentTimeInTimezone } from './timezoneUtils';

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
    
    // First try to get from Firebase - this is now the primary source
    const userRef = ref(database, `users/${userId}/streakData`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const firebaseData = snapshot.val();
      // Update timezone if it's different
      if (firebaseData.timezone !== userTimezone) {
        firebaseData.timezone = userTimezone;
        await saveStreakData(userId, firebaseData);
      }
      console.log('✅ Firebase streak data found:', firebaseData);
      
      // Also update localStorage for offline access
      const key = getStreakKey(userId);
      localStorage.setItem(key, JSON.stringify(firebaseData));
      return firebaseData;
    } else {
      console.log('⚠️ No Firebase streak data found, checking localStorage');
    }
  } catch (error) {
    console.error('❌ Error getting streak data from Firebase:', error);
  }
  
  // Fallback to localStorage only if Firebase fails
  const key = getStreakKey(userId);
  const data = localStorage.getItem(key);
  
  if (data) {
    try {
      const parsedData = JSON.parse(data);
      console.log('📱 LocalStorage streak data found (fallback):', parsedData);
      return parsedData;
    } catch (error) {
      console.error('❌ Error parsing streak data:', error);
    }
  }
  
  const userTimezone = getUserTimezone();
  console.log('🆕 Returning default streak data for timezone:', userTimezone);
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
  
  console.log('💾 Saving streak data to Firebase for user:', userId, dataWithTimezone);
  
  try {
    // Save to Firebase first - this is the main storage now
    const userRef = ref(database, `users/${userId}`);
    const updateData = {
      streakData: dataWithTimezone,
      currentStreak: dataWithTimezone.currentStreak,
      longestStreak: dataWithTimezone.longestStreak,
      lastLogin: dataWithTimezone.lastLoginDate,
      lastStreakUpdate: dataWithTimezone.lastUpdateTimestamp,
      timezone: userTimezone
    };
    
    await update(userRef, updateData);
    console.log('✅ Streak data saved to Firebase successfully:', updateData);
  } catch (error) {
    console.error('❌ Error saving streak data to Firebase:', error);
    throw error;
  }
  
  // Also save to localStorage as backup only after Firebase success
  const key = getStreakKey(userId);
  localStorage.setItem(key, JSON.stringify(dataWithTimezone));
  
  // Update legacy keys for backward compatibility
  localStorage.setItem(`${userId}_login_streak`, dataWithTimezone.currentStreak.toString());
  localStorage.setItem(`${userId}_longest_streak`, dataWithTimezone.longestStreak.toString());
  localStorage.setItem(`${userId}_last_login`, dataWithTimezone.lastLoginDate);
  
  console.log('💾 Streak data also saved to localStorage as backup');
};

export const updateDailyStreak = async (userId: string): Promise<{ streakUpdated: boolean; newStreak: number; bonusPoints: number }> => {
  const userTimezone = getUserTimezone();
  console.log('🔥 Updating daily streak for user:', userId, 'in timezone:', userTimezone);
  
  const todayDateString = getTodayDateString(userTimezone);
  console.log('📅 Today date in user timezone:', todayDateString);
  
  const streakData = await getStreakData(userId);
  console.log('📊 Current streak data:', streakData);
  
  // Check if already logged in today
  if (streakData.lastLoginDate === todayDateString) {
    console.log('⚠️ User already logged in today');
    return {
      streakUpdated: false,
      newStreak: streakData.currentStreak,
      bonusPoints: 0
    };
  }
  
  // Calculate yesterday's date in user's timezone
  const yesterdayDateString = getYesterdayDateString(userTimezone);
  console.log('📅 Yesterday date in user timezone:', yesterdayDateString);
  
  let newStreak = 1;
  let bonusPoints = 5; // Base login bonus
  
  // Check if user logged in yesterday (consecutive day)
  if (streakData.lastLoginDate === yesterdayDateString) {
    newStreak = streakData.currentStreak + 1;
    console.log('🔥 Consecutive login detected! New streak:', newStreak);
    
    // Add streak bonuses
    if (newStreak % 7 === 0) {
      bonusPoints += 15; // Weekly streak bonus
      console.log('🎉 Weekly streak bonus!', bonusPoints);
    } else if (newStreak % 3 === 0) {
      bonusPoints += 10; // 3-day streak bonus
      console.log('🎊 3-day streak bonus!', bonusPoints);
    }
  } else {
    console.log('🔄 Streak reset to 1 day');
  }
  
  // Update longest streak if needed
  const newLongestStreak = Math.max(newStreak, streakData.longestStreak);
  
  // Save updated data to Firebase (primary storage)
  const updatedData: StreakData = {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastLoginDate: todayDateString,
    lastUpdateTimestamp: Date.now(),
    timezone: userTimezone
  };
  
  await saveStreakData(userId, updatedData);
  
  console.log(`🔥 Streak updated for user ${userId}: ${newStreak} days (longest: ${newLongestStreak}), +${bonusPoints} points - timezone: ${userTimezone}`);
  
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
