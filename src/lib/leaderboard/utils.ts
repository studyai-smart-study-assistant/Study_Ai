
// Get formatted last active text based on timestamp
export const getLastActiveText = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} मिनट पहले`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} घंटे पहले`;
  }
  
  // Less than 2 days
  if (diff < 172800000) {
    return 'कल';
  }
  
  // More than 2 days
  return 'कुछ दिन पहले';
};
