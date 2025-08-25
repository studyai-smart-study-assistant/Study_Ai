
// App Usage Tracker - Real time tracking for student app usage
export interface AppUsageData {
  totalMinutes: number;
  sessionsCount: number;
  lastActiveDate: string;
  weeklyUsage: number[];
  longestSession: number;
}

const USAGE_KEY_PREFIX = 'app_usage_';
const SESSION_KEY_PREFIX = 'current_session_';

let sessionStartTime: number | null = null;
let isTracking = false;
let currentUserId: string | null = null;

// Start tracking app usage for a user
export const startAppUsageTracking = (userId: string): void => {
  if (isTracking && currentUserId === userId) {
    return; // Already tracking for this user
  }
  
  currentUserId = userId;
  sessionStartTime = Date.now();
  isTracking = true;
  
  // Store session start time
  localStorage.setItem(`${SESSION_KEY_PREFIX}${userId}`, sessionStartTime.toString());
  
  console.log(`App usage tracking started for user: ${userId}`);
};

// Stop tracking and save session data
export const stopAppUsageTracking = (userId: string): void => {
  if (!isTracking || !sessionStartTime || currentUserId !== userId) {
    return;
  }
  
  const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // in minutes
  
  if (sessionDuration > 0) {
    saveUsageSession(userId, sessionDuration);
  }
  
  // Clear session data
  localStorage.removeItem(`${SESSION_KEY_PREFIX}${userId}`);
  sessionStartTime = null;
  isTracking = false;
  currentUserId = null;
  
  console.log(`App usage tracking stopped for user: ${userId}, Session: ${sessionDuration} minutes`);
};

// Save usage session data
const saveUsageSession = (userId: string, sessionMinutes: number): void => {
  try {
    const usageKey = `${USAGE_KEY_PREFIX}${userId}`;
    const existingData = localStorage.getItem(usageKey);
    
    let usageData: AppUsageData = {
      totalMinutes: 0,
      sessionsCount: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      weeklyUsage: [0, 0, 0, 0, 0, 0, 0], // Sunday to Saturday
      longestSession: 0
    };
    
    if (existingData) {
      usageData = JSON.parse(existingData);
    }
    
    // Update usage data
    usageData.totalMinutes += sessionMinutes;
    usageData.sessionsCount += 1;
    usageData.lastActiveDate = new Date().toISOString().split('T')[0];
    usageData.longestSession = Math.max(usageData.longestSession, sessionMinutes);
    
    // Update weekly usage (current day of week)
    const dayOfWeek = new Date().getDay();
    usageData.weeklyUsage[dayOfWeek] += sessionMinutes;
    
    localStorage.setItem(usageKey, JSON.stringify(usageData));
    
    console.log(`Usage session saved: ${sessionMinutes} minutes for user ${userId}`);
  } catch (error) {
    console.error('Error saving usage session:', error);
  }
};

// Get user's app usage data
export const getUserAppUsage = (userId: string): AppUsageData => {
  try {
    const usageKey = `${USAGE_KEY_PREFIX}${userId}`;
    const existingData = localStorage.getItem(usageKey);
    
    if (existingData) {
      return JSON.parse(existingData);
    }
  } catch (error) {
    console.error('Error getting user app usage:', error);
  }
  
  return {
    totalMinutes: 0,
    sessionsCount: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    weeklyUsage: [0, 0, 0, 0, 0, 0, 0],
    longestSession: 0
  };
};

// Get formatted usage time string
export const getFormattedUsageTime = (totalMinutes: number): string => {
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

// Check and resume tracking if app was closed unexpectedly
export const resumeTrackingIfNeeded = (userId: string): void => {
  const sessionKey = `${SESSION_KEY_PREFIX}${userId}`;
  const sessionStart = localStorage.getItem(sessionKey);
  
  if (sessionStart) {
    const startTime = parseInt(sessionStart);
    const timeDiff = Date.now() - startTime;
    
    // If less than 5 minutes, resume tracking
    if (timeDiff < 5 * 60 * 1000) {
      sessionStartTime = startTime;
      isTracking = true;
      currentUserId = userId;
      console.log(`Resumed app usage tracking for user: ${userId}`);
    } else {
      // Session too old, clean up
      localStorage.removeItem(sessionKey);
    }
  }
};

// Auto-save usage data every 30 seconds while tracking
setInterval(() => {
  if (isTracking && sessionStartTime && currentUserId) {
    const currentSessionMinutes = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    if (currentSessionMinutes > 0) {
      // Save current progress without stopping tracking
      const usageKey = `${USAGE_KEY_PREFIX}${currentUserId}`;
      const existingData = localStorage.getItem(usageKey);
      
      let usageData: AppUsageData = {
        totalMinutes: 0,
        sessionsCount: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
        weeklyUsage: [0, 0, 0, 0, 0, 0, 0],
        longestSession: 0
      };
      
      if (existingData) {
        usageData = JSON.parse(existingData);
      }
      
      // Update only the current session time without incrementing session count
      const tempData = { ...usageData };
      tempData.lastActiveDate = new Date().toISOString().split('T')[0];
      
      localStorage.setItem(usageKey, JSON.stringify(tempData));
    }
  }
}, 30000); // Every 30 seconds
