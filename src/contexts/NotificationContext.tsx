
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  NotificationData, 
  getActiveNotifications, 
  clearNotification,
  showNotification as showNotificationService
} from '@/utils/notificationService';

interface NotificationContextType {
  notifications: NotificationData[];
  showNotification: (data: NotificationData) => void;
  dismissNotification: (index: number) => void;
  dismissAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Initialize notifications without auto-requesting permission
  useEffect(() => {
    // Poll for active notifications from service
    const interval = setInterval(() => {
      const activeNotifications = getActiveNotifications();
      if (JSON.stringify(activeNotifications) !== JSON.stringify(notifications)) {
        setNotifications(activeNotifications);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [notifications]);

  const showNotification = async (data: NotificationData) => {
    await showNotificationService(data);
    // The notification will be added to active notifications in the service
    // Our useEffect will pick it up and update the state
  };

  const dismissNotification = (index: number) => {
    clearNotification(index);
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const dismissAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      dismissNotification,
      dismissAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
