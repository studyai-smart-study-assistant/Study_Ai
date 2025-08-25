
// Timezone utility functions for handling user's local time
export const getUserTimezone = (): string => {
  try {
    // Get user's timezone from browser
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone, defaulting to Asia/Kolkata');
    return 'Asia/Kolkata'; // Default to IST
  }
};

export const getCurrentTimeInTimezone = (timezone?: string): Date => {
  const userTimezone = timezone || getUserTimezone();
  const now = new Date();
  
  try {
    // Create a date in user's timezone
    const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}));
    return timeInTimezone;
  } catch (error) {
    console.warn('Error getting time in timezone, using local time');
    return now;
  }
};

export const getTimeBasedGreeting = (timezone?: string): string => {
  const currentTime = getCurrentTimeInTimezone(timezone);
  const hour = currentTime.getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

export const getHindiTimeBasedGreeting = (timezone?: string): string => {
  const currentTime = getCurrentTimeInTimezone(timezone);
  const hour = currentTime.getHours();
  
  if (hour >= 5 && hour < 12) {
    return "सुप्रभात";
  } else if (hour >= 12 && hour < 17) {
    return "नमस्कार";
  } else if (hour >= 17 && hour < 21) {
    return "शुभ संध्या";
  } else {
    return "शुभ रात्रि";
  }
};

export const getTodayDateString = (timezone?: string): string => {
  const currentTime = getCurrentTimeInTimezone(timezone);
  return currentTime.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getYesterdayDateString = (timezone?: string): string => {
  const currentTime = getCurrentTimeInTimezone(timezone);
  const yesterday = new Date(currentTime);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Function to check if it's a new day in user's timezone
export const isNewDayInUserTimezone = (lastLoginDate: string, timezone?: string): boolean => {
  const todayString = getTodayDateString(timezone);
  return lastLoginDate !== todayString;
};

// Get current hour in user's timezone
export const getCurrentHourInTimezone = (timezone?: string): number => {
  const currentTime = getCurrentTimeInTimezone(timezone);
  return currentTime.getHours();
};

// Format time for display in user's timezone
export const formatTimeInUserTimezone = (date: Date, timezone?: string): string => {
  const userTimezone = timezone || getUserTimezone();
  
  try {
    return date.toLocaleString('hi-IN', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return date.toLocaleString('hi-IN');
  }
};

// Debug function to show current time info
export const getTimezoneDebugInfo = (timezone?: string) => {
  const userTimezone = timezone || getUserTimezone();
  const currentTime = getCurrentTimeInTimezone(userTimezone);
  
  return {
    detectedTimezone: userTimezone,
    currentTime: currentTime.toISOString(),
    localTimeString: formatTimeInUserTimezone(currentTime, userTimezone),
    hour: currentTime.getHours(),
    dateString: getTodayDateString(userTimezone),
    greeting: getTimeBasedGreeting(userTimezone),
    hindiGreeting: getHindiTimeBasedGreeting(userTimezone)
  };
};
