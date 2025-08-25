
import React from 'react';
import { Button } from "@/components/ui/button";

interface UserCardActionsProps {
  isCurrentUser: boolean;
  lastActive: string;
}

const UserCardActions: React.FC<UserCardActionsProps> = ({ 
  isCurrentUser,
  lastActive
}) => {
  return (
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>अंतिम सक्रिय: {lastActive}</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          प्रोफाइल देखें
        </Button>
        {!isCurrentUser && (
          <Button variant="outline" size="sm" className="h-8 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/40">
            दोस्त बनाएँ
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserCardActions;
