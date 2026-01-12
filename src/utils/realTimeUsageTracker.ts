
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

const USAGE_KEY = (userId: string) => `${userId}_usage_data`;

// Get default usage data
const getDefaultUsageData = (): UserUsageData => ({
  totalMinutes: 0,
  sessionsCount: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  weeklyUsage: [0, 0, 0, 0, 0, 0, 0],
  longestSession: 0,
  isActive: false
});

// Get usage data from localStorage
const getUsageFromStorage = (userId: string): UserUsageData => {
  try {
    const data = localStorage.getItem(USAGE_KEY(userId));
    return data ? JSON.parse(data) : getDefaultUsageData();
  } catch {
    return getDefaultUsageData();
  }
};

// Save usage data to localStorage
const saveUsageToStorage = (userId: string, data: UserUsageData): void => {
  try {
    localStorage.setItem(USAGE_KEY(userId), JSON.stringify(data));
  } catch (error) {
    console.error('Error saving usage data:', error);
  }
};

// Start real-time usage tracking
export const startRealTimeUsageTracking = async (userId: string): Promise<void> => {
  if (isTracking && currentUserId === userId) {
    return;
  }
  
  currentUserId = userId;
  sessionStartTime = Date.now();
  isTracking = true;
  
  const existingData = getUsageFromStorage(userId);
  saveUsageToStorage(userId, {
    ...existingData,
    currentSessionStart: sessionStartTime,
    currentSessionDuration: 0,
    isActive: true,
    lastActiveDate: new Date().toISOString().split('T')[0]
  });
  
  // Start syncing every 15 seconds
  startSyncInterval(userId);
};

// Stop tracking and save final session
export const stopRealTimeUsageTracking = async (userId: string): Promise<void> => {
  if (!isTracking || !sessionStartTime || currentUserId !== userId) {
    return;
  }
  
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
  
  if (sessionDuration > 0) {
    await saveUsageSession(userId, sessionDuration);
  }
  
  const userData = getUsageFromStorage(userId);
  saveUsageToStorage(userId, {
    ...userData,
    currentSessionStart: undefined,
    currentSessionDuration: 0,
    isActive: false
  });
  
  sessionStartTime = null;
  isTracking = false;
  currentUserId = null;
  
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Save usage session
const saveUsageSession = async (userId: string, sessionMinutes: number): Promise<void> => {
  const existingData = getUsageFromStorage(userId);
  
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
  
  saveUsageToStorage(userId, updatedData);
};

// Start sync interval
const startSyncInterval = (userId: string): void => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(() => {
    if (isTracking && sessionStartTime && currentUserId === userId) {
      const currentSessionMinutes = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
      
      const userData = getUsageFromStorage(userId);
      saveUsageToStorage(userId, {
        ...userData,
        currentSessionDuration: currentSessionMinutes,
        lastActiveDate: new Date().toISOString().split('T')[0],
        isActive: true
      });
    }
  }, 15000);
};

// Get user's usage data
export const getUserRealTimeUsage = async (userId: string): Promise<UserUsageData> => {
  return getUsageFromStorage(userId);
};

// Observe user's usage data changes (simplified - just returns data)
export const observeUserUsage = (userId: string, callback: (data: UserUsageData) => void): (() => void) => {
  callback(getUsageFromStorage(userId));
  return () => {};
};

// Get all users usage data
export const getAllUsersUsage = async (): Promise<Record<string, UserUsageData>> => {
  return {};
};

// Observe all users usage
export const observeAllUsersUsage = (callback: (data: Record<string, UserUsageData>) => void): (() => void) => {
  callback({});
  return () => {};
};

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
  const userData = getUsageFromStorage(userId);
  
  if (userData.currentSessionStart && userData.isActive) {
    const timeDiff = Date.now() - userData.currentSessionStart;
    
    // If less than 5 minutes, resume tracking
    if (timeDiff < 5 * 60 * 1000) {
      sessionStartTime = userData.currentSessionStart;
      isTracking = true;
      currentUserId = userId;
      startSyncInterval(userId);
    } else {
      // Session too old, mark as inactive
      saveUsageToStorage(userId, {
        ...userData,
        currentSessionStart: undefined,
        currentSessionDuration: 0,
        isActive: false
      });
    }
  }
};
