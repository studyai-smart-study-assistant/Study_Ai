
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();

  // Auto-dismiss notifications after a delay
  useEffect(() => {
    if (notifications.length > 0) {
      const timeouts = notifications.map((_, index) => {
        // Auto dismiss after duration or default 5000ms
        const duration = notifications[index]?.duration || 5000;
        return setTimeout(() => dismissNotification(index), duration);
      });

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 w-auto max-w-3xl">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={`notification-${index}`}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-purple-200 dark:border-purple-900 w-full"
          >
            <div className="flex items-center p-4 justify-between w-full">
              <div className="flex items-center flex-grow">
                <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
                  <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => dismissNotification(index)}
                className="ml-4 flex-shrink-0 flex rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
