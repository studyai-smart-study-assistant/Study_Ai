
// Function to get user initials
export const getUserInitials = (name: string): string => {
  if (!name || name.trim() === '') return 'U';
  
  const nameParts = name.trim().split(" ").filter(part => part.length > 0);
  
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  
  const firstPart = nameParts[0];
  if (firstPart.length >= 2) {
    return firstPart.substring(0, 2).toUpperCase();
  }
  
  return firstPart[0].toUpperCase();
};

// Function to generate a deterministic color based on user id
export const getAvatarColor = (userId: string): string => {
  const colors = [
    "bg-purple-500 text-white", // Primary purple
    "bg-indigo-500 text-white", // Indigo
    "bg-blue-500 text-white",   // Blue
    "bg-green-500 text-white",  // Green
    "bg-yellow-500 text-white", // Yellow
    "bg-orange-500 text-white", // Orange
    "bg-red-500 text-white",    // Red
    "bg-pink-500 text-white",   // Pink
    "bg-violet-500 text-white", // Violet
    "bg-emerald-500 text-white", // Emerald
    "bg-teal-500 text-white",   // Teal
    "bg-cyan-500 text-white",   // Cyan
  ];
  
  // Use the sum of character codes to pick a color
  let sum = 0;
  for (let i = 0; i < userId.length; i++) {
    sum += userId.charCodeAt(i);
  }
  
  return colors[sum % colors.length];
};
