
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Home, Library, Settings, User } from 'lucide-react';

const LibraryBottomNav: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 shadow-lg border-t border-gray-200 dark:border-gray-800 h-16 z-50 pb-safe">
      <div className="grid grid-cols-5 h-full">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center ${
            isActive('/') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">होम</span>
        </Link>
        
        <Link
          to="/library"
          className={`flex flex-col items-center justify-center ${
            isActive('/library') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-xs mt-1">पुस्तकालय</span>
        </Link>
        
        <Link
          to="/library/upload"
          className="flex flex-col items-center justify-center"
        >
          <div className="bg-purple-600 rounded-full p-3 -mt-5 shadow-lg">
            <Book className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs mt-1 text-purple-600 dark:text-purple-400">अपलोड</span>
        </Link>
        
        <Link
          to="/library/my-books"
          className={`flex flex-col items-center justify-center ${
            isActive('/library/my-books') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Book className="w-5 h-5" />
          <span className="text-xs mt-1">मेरी पुस्तकें</span>
        </Link>
        
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center ${
            isActive('/profile') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">प्रोफाइल</span>
        </Link>
      </div>
    </div>
  );
};

export default LibraryBottomNav;
