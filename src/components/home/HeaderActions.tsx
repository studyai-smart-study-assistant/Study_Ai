
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatHistory from '@/components/ChatHistory';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderActionsProps {
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ currentChatId, onSelectChat }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile button clicked, navigating to /profile');
    navigate('/profile');
  };

  return (
    <div className="flex items-center gap-3">
      {currentChatId && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChatHistory 
            onSelectChat={onSelectChat}
            currentChatId={currentChatId}
          />
        </motion.div>
      )}
      
      {/* Notification Bell - Show for all users */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <NotificationBell className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40" />
      </motion.div>
      
      {currentUser ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleProfileClick}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-full transition-all duration-300 hover:shadow-lg"
          >
            <UserCircle className="h-5 w-5" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost"
            size="sm"
            asChild
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40 rounded-full transition-all duration-300 hover:shadow-lg"
          >
            <Link to="/login">
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default HeaderActions;
