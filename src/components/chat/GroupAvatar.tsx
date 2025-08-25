
import React from 'react';
import { Users, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupAvatarProps {
  groupName: string;
  memberCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isAdmin?: boolean;
  className?: string;
  showCrown?: boolean;
}

const GroupAvatar: React.FC<GroupAvatarProps> = ({
  groupName,
  memberCount = 0,
  size = 'md',
  isAdmin = false,
  className,
  showCrown = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'G';
  };

  const getGradient = (name: string) => {
    const gradients = [
      'from-purple-500 via-pink-500 to-red-500',
      'from-blue-500 via-cyan-500 to-teal-500',
      'from-green-500 via-emerald-500 to-lime-500',
      'from-yellow-500 via-orange-500 to-red-500',
      'from-indigo-500 via-purple-500 to-pink-500',
      'from-rose-500 via-pink-500 to-purple-500',
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-xl border-3 border-white dark:border-gray-800 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:border-opacity-80 animate-fade-in",
          sizeClasses[size],
          getGradient(groupName),
          "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        )}
      >
        <span className="relative z-10 drop-shadow-lg">
          {getInitials(groupName)}
        </span>
        
        {/* Animated glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br opacity-20 animate-pulse blur-sm" 
             style={{
               background: `linear-gradient(135deg, ${getGradient(groupName).replace('from-', '').replace('via-', '').replace('to-', '')})`
             }}
        />
        
        {/* Member count indicator with enhanced design */}
        {memberCount > 0 && size !== 'sm' && (
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg animate-scale-in group-hover:scale-110 transition-transform duration-200 font-semibold">
            {memberCount > 99 ? '99+' : memberCount}
          </div>
        )}
        
        {/* Admin crown with enhanced animation */}
        {(isAdmin || showCrown) && (
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg animate-scale-in group-hover:scale-110 transition-transform duration-200 hover:rotate-12">
            <Crown className="w-3 h-3 drop-shadow-sm" />
          </div>
        )}
      </div>
      
      {/* Users icon overlay for groups with enhanced design */}
      <div className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg animate-scale-in group-hover:scale-110 transition-all duration-200">
        <Users className="w-2.5 h-2.5 drop-shadow-sm" />
      </div>
    </div>
  );
};

export default GroupAvatar;
