// Better avatar generation utility
export const generateStudentAvatar = (name: string, gender?: 'male' | 'female') => {
  if (!name) return { initials: 'ST', colors: 'from-slate-500 to-gray-500' };
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Student-friendly color combinations
  const colorCombinations = [
    'from-indigo-500 to-purple-500',    // Professional blue-purple
    'from-emerald-500 to-teal-500',     // Fresh green-teal
    'from-blue-500 to-cyan-500',        // Ocean blue
    'from-purple-500 to-pink-500',      // Creative purple-pink
    'from-orange-500 to-red-500',       // Energetic orange-red
    'from-teal-500 to-green-500',       // Nature teal-green
    'from-violet-500 to-purple-500',    // Royal violet
    'from-cyan-500 to-blue-500',        // Sky cyan-blue
    'from-pink-500 to-rose-500',        // Warm pink-rose
    'from-amber-500 to-orange-500',     // Sunny amber-orange
  ];
  
  // Generate consistent color based on name
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % colorCombinations.length;
  
  return {
    initials,
    colors: colorCombinations[colorIndex]
  };
};

export const getAvatarProps = (name?: string, gender?: 'male' | 'female') => {
  const { initials, colors } = generateStudentAvatar(name || '', gender);
  return {
    className: `bg-gradient-to-br ${colors} text-white font-bold shadow-lg`,
    children: initials
  };
};