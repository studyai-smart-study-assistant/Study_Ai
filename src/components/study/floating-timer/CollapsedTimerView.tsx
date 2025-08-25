
import React from 'react';
import { Clock } from 'lucide-react';

interface CollapsedTimerViewProps {
  isActive: boolean;
}

export const CollapsedTimerView: React.FC<CollapsedTimerViewProps> = ({
  isActive
}) => {
  return (
    <div className="relative">
      <Clock className="h-6 w-6" />
      {isActive && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />
      )}
    </div>
  );
};
