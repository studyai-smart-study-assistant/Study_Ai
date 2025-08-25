
import React from 'react';
import { User, Book } from 'lucide-react';

interface UserInfoCardsProps {
  userCategory: string;
  educationLevel: string;
}

const UserInfoCards: React.FC<UserInfoCardsProps> = ({ userCategory, educationLevel }) => {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-gray-700/50 rounded-lg break-words">
        <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full flex-shrink-0">
          <User className="h-5 w-5 text-purple-600 dark:text-purple-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
          <p className="font-medium text-gray-900 dark:text-white break-words">
            {userCategory ? userCategory.charAt(0).toUpperCase() + userCategory.slice(1) : 'Not specified'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-gray-700/50 rounded-lg break-words">
        <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full flex-shrink-0">
          <Book className="h-5 w-5 text-purple-600 dark:text-purple-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Education Level</p>
          <p className="font-medium text-gray-900 dark:text-white break-words">
            {educationLevel ? educationLevel.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserInfoCards;
