
import { ref, set, get, onValue, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export interface UserUsageData {
  totalMinutes: number;
  sessionsCount: number;
  lastActiveDate: string;
  weeklyUsage: number[];
  longestSession: number;
  currentSessionStart?: number;
  currentSessionDuration?: number;
  isActive: boolean;
}

let sessionStartTime: number | null = null;
let isTracking = false;
let currentUserId: string | null = null;
let syncInterval: NodeJS.Timeout | null = null;

// Start real-time usage tracking
export const startRealTimeUsageTracking = async (userId: string): Promise<void> => {
  if (isTracking && currentUserId === userId) {
    console.log('🕒 Already tracking for user:', userId);
    return;
  }
  
  currentUserId = userId;
  sessionStartTime = Date.now();
  isTracking = true;
  
  console.log(`🕒 Real-time usage tracking STARTED for user: ${userId} at ${new Date().toLocaleTimeString()}`);
  
  // Mark user as active in Firebase
  const userUsageRef = ref(database, `usage/${userId}`);
  const snapshot = await get(userUsageRef);
  const existingData = snapshot.exists() ? snapshot.val() : getDefaultUsageData();
  
  await set(userUsageRef, {
    ...existingData,
    currentSessionStart: sessionStartTime,
    currentSessionDuration: 0,
    isActive: true,
    lastActiveDate: new Date().toISOString().split('T')[0]
  });
  
  console.log('🕒 User marked as ACTIVE in Firebase');
  
  // Start syncing every 15 seconds for real-time updates
  startSyncInterval(userId);
};

// Stop tracking and save final session
export const stopRealTimeUsageTracking = async (userId: string): Promise<void> => {
  if (!isTracking || !sessionStartTime || currentUserId !== userId) {
    console.log('🕒 No active tracking to stop for user:', userId);
    return;
  }
  
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
  
  console.log(`🕒 STOPPING usage tracking for user: ${userId}, Session duration: ${sessionDuration} minutes`);
  
  if (sessionDuration > 0) {
    await saveUsageSession(userId, sessionDuration);
  }
  
  // Mark user as inactive
  const userUsageRef = ref(database, `usage/${userId}`);
  const snapshot = await get(userUsageRef);
  if (snapshot.exists()) {
    const userData = snapshot.val();
    await set(userUsageRef, {
      ...userData,
      currentSessionStart: null,
      currentSessionDuration: 0,
      isActive: false
    });
    console.log('🕒 User marked as INACTIVE in Firebase');
  }
  
  // Clear tracking state
  sessionStartTime = null;
  isTracking = false;
  currentUserId = null;
  
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  
  console.log(`🕒 Real-time usage tracking STOPPED for user: ${userId}`);
};

// Save usage session to Firebase
const saveUsageSession = async (userId: string, sessionMinutes: number): Promise<void> => {
  try {
    console.log(`💾 Saving session: ${sessionMinutes} minutes for user ${userId}`);
    
    const userUsageRef = ref(database, `usage/${userId}`);
    const snapshot = await get(userUsageRef);
    const existingData = snapshot.exists() ? snapshot.val() : getDefaultUsageData();
    
    const updatedData: UserUsageData = {
      ...existingData,
      totalMinutes: (existingData.totalMinutes || 0) + sessionMinutes,
      sessionsCount: (existingData.sessionsCount || 0) + 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      longestSession: Math.max(existingData.longestSession || 0, sessionMinutes),
      isActive: false
    };
    
    // Update weekly usage
    const dayOfWeek = new Date().getDay();
    if (!updatedData.weeklyUsage) {
      updatedData.weeklyUsage = [0, 0, 0, 0, 0, 0, 0];
    }
    updatedData.weeklyUsage[dayOfWeek] += sessionMinutes;
    
    await set(userUsageRef, updatedData);
    console.log(`💾 SUCCESS: Session saved - Total: ${updatedData.totalMinutes} minutes, Sessions: ${updatedData.sessionsCount}`);
  } catch (error) {
    console.error('❌ Error saving usage session to Firebase:', error);
  }
};

// Start sync interval -更频繁的更新
const startSyncInterval = (userId: string): void => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  console.log('🕒 Starting sync interval for real-time updates');
  
  syncInterval = setInterval(async () => {
    if (isTracking && sessionStartTime && currentUserId === userId) {
      const currentSessionMinutes = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
      
      console.log(`🔄 Sync update: Current session ${currentSessionMinutes} minutes`);
      
      // Update current session time in Firebase without ending the session
      const userUsageRef = ref(database, `usage/${userId}`);
      const snapshot = await get(userUsageRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        await set(userUsageRef, {
          ...userData,
          currentSessionDuration: currentSessionMinutes,
          lastActiveDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
        console.log(`🔄 Updated current session duration: ${currentSessionMinutes} minutes`);
      }
    }
  }, 15000); // Every 15 seconds for more responsive updates
};

// Get user's usage data from Firebase
export const getUserRealTimeUsage = async (userId: string): Promise<UserUsageData> => {
  try {
    const userUsageRef = ref(database, `usage/${userId}`);
    const snapshot = await get(userUsageRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(`📊 Retrieved usage data for ${userId}:`, data);
      return data;
    }
  } catch (error) {
    console.error('Error getting user usage from Firebase:', error);
  }
  
  return getDefaultUsageData();
};

// Listen to user's usage data changes
export const observeUserUsage = (userId: string, callback: (data: UserUsageData) => void): (() => void) => {
  const userUsageRef = ref(database, `usage/${userId}`);
  
  const unsubscribe = onValue(userUsageRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(getDefaultUsageData());
    }
  });
  
  return unsubscribe;
};

// Get all users usage data for leaderboard
export const getAllUsersUsage = async (): Promise<Record<string, UserUsageData>> => {
  try {
    const usageRef = ref(database, 'usage');
    const snapshot = await get(usageRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('📊 Retrieved all users usage data:', Object.keys(data).length, 'users');
      return data;
    }
  } catch (error) {
    console.error('Error getting all users usage:', error);
  }
  
  return {};
};

// Observe all users usage for real-time leaderboard
export const observeAllUsersUsage = (callback: (data: Record<string, UserUsageData>) => void): (() => void) => {
  const usageRef = ref(database, 'usage');
  
  const unsubscribe = onValue(usageRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
  
  return unsubscribe;
};

// Helper function for default usage data
const getDefaultUsageData = (): UserUsageData => ({
  totalMinutes: 0,
  sessionsCount: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  weeklyUsage: [0, 0, 0, 0, 0, 0, 0],
  longestSession: 0,
  isActive: false
});

// Format usage time
export const formatUsageTime = (totalMinutes: number): string => {
  if (totalMinutes < 1) {
    return '0 मिनट';
  }
  
  if (totalMinutes < 60) {
    return `${totalMinutes} मिनट`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours < 24) {
    return minutes > 0 ? `${hours} घंटे ${minutes} मिनट` : `${hours} घंटे`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days} दिन ${remainingHours} घंटे`;
  }
  
  return `${days} दिन`;
};

// Resume tracking if needed
export const resumeRealTimeTracking = async (userId: string): Promise<void> => {
  try {
    const userUsageRef = ref(database, `usage/${userId}`);
    const snapshot = await get(userUsageRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      
      if (userData.currentSessionStart && userData.isActive) {
        const sessionStart = userData.currentSessionStart;
        const timeDiff = Date.now() - sessionStart;
        
        console.log(`🔄 Checking resume conditions: Time diff ${Math.floor(timeDiff / 1000 / 60)} minutes`);
        
        // If less than 5 minutes, resume tracking
        if (timeDiff < 5 * 60 * 1000) {
          sessionStartTime = sessionStart;
          isTracking = true; 
          currentUserId = userId;
          startSyncInterval(userId);
          console.log(`🔄 RESUMED real-time usage tracking for user: ${userId}`);
        } else {
          // Session too old, mark as inactive
          await set(userUsageRef, {
            ...userData,
            currentSessionStart: null,
            currentSessionDuration: 0,
            isActive: false
          });
          console.log('🔄 Session too old, marked as inactive');
        }
      }
    }
  } catch (error) {
    console.error('Error resuming real-time tracking:', error);
  }
};
