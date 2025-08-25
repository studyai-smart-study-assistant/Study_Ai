
import React from 'react';
import { Trophy, Medal } from 'lucide-react';

interface RankIconProps {
  rank: number;
}

const RankIcon: React.FC<RankIconProps> = ({ rank }) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500 mr-2" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400 mr-2" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600 mr-2" />;
  return <span className="font-mono text-lg font-bold min-w-[24px] text-center mr-2">{rank}</span>;
};

export default RankIcon;
