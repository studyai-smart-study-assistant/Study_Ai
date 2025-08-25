
import React from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationPanel: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={`notification-${index}`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-purple-200 dark:border-purple-900"
        >
          <div className="flex items-start p-4">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
            
            <button
              onClick={() => dismissNotification(index)}
              className="ml-4 flex-shrink-0 flex rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPanel;
