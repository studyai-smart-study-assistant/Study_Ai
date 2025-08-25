
import React from 'react';
import { Award } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getBadgeInfo } from '@/lib/leaderboard';

interface UserBadgesProps {
  badges: string[]; // Badge IDs as strings
}

const UserBadges: React.FC<UserBadgesProps> = ({ badges }) => {
  const getBadgeColors = (badgeId: string) => {
    const badgeInfo = getBadgeInfo(badgeId);
    const colorMap: Record<string, { bg: string, text: string, border: string }> = {
      'blue': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
      'green': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
      'purple': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
      'amber': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
      'red': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
      'teal': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
      'indigo': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
      'orange': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
      'rose': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
      'yellow': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
      'emerald': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
      'slate': { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
      'cyan': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
      'pink': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
      'sky': { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
      'violet': { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
      'lime': { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800' },
      'fuchsia': { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
      'brown': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
      'gray': { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' },
    };
    
    return colorMap[badgeInfo.color] || colorMap.gray;
  };
  
  return (
    <div className="mb-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">बैज:</p>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {badges.map((badgeId, index) => {
            const badgeInfo = getBadgeInfo(badgeId);
            const colors = getBadgeColors(badgeId);
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`${colors.bg} ${colors.text} ${colors.border} hover:${colors.bg.replace('bg-', 'bg-opacity-70')}`}
                  >
                    <Award className="h-3 w-3 mr-1" />
                    {badgeInfo.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center">
                  <p className="font-medium">{badgeInfo.name}</p>
                  <p className="text-xs">{badgeInfo.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default UserBadges;
