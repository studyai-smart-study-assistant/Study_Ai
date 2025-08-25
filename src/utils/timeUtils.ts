
import { getUserTimezone, getCurrentTimeInTimezone, getHindiTimeBasedGreeting } from './timezoneUtils';

export const getTimeBasedGreeting = (): string => {
  const userTimezone = getUserTimezone();
  const currentTime = getCurrentTimeInTimezone(userTimezone);
  const hour = currentTime.getHours();
  
  console.log(`🕒 Current time in ${userTimezone}: ${currentTime.toLocaleString()}, Hour: ${hour}`);
  
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

export const getHindiGreeting = (): string => {
  const userTimezone = getUserTimezone();
  return getHindiTimeBasedGreeting(userTimezone);
};
