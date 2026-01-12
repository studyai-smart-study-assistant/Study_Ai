
import { useState, useEffect, useCallback } from 'react';

// Define the notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  type?: 'group' | 'message' | 'system';
  groupId?: string;
  chatId?: string;
  senderName?: string;
  isRead?: boolean;
}

// Sample notifications for demonstration
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'पाठ्यक्रम अपडेट',
    message: 'आपका गणित का पाठ्यक्रम अपडेट किया गया है। नए अध्याय जोड़े गए हैं।',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 5,
    type: 'system'
  },
  {
    id: '2',
    title: 'अध्ययन अनुस्मारक',
    message: 'आपका दैनिक अध्ययन लक्ष्य अभी तक पूरा नहीं हुआ है। आज के लिए 30 मिनट अध्ययन बाकी है।',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 30,
    type: 'system'
  },
  {
    id: '3',
    title: 'क्विज़ परिणाम',
    message: 'बधाई हो! आपने विज्ञान क्विज़ में 90% स्कोर किया है। अपने परिणाम देखें।',
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    type: 'system'
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const savedNotifications = localStorage.getItem('study_ai_notifications');
      return savedNotifications ? JSON.parse(savedNotifications) : DEMO_NOTIFICATIONS;
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
      return DEMO_NOTIFICATIONS;
    }
  });
  
  const [playSound, setPlaySound] = useState<boolean>(() => {
    try {
      const savedSetting = localStorage.getItem('notification_sound_enabled');
      return savedSetting !== null ? savedSetting === 'true' : true;
    } catch (error) {
      return true;
    }
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('study_ai_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);
  
  // Save sound setting to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notification_sound_enabled', playSound.toString());
    } catch (error) {
      console.error('Error saving sound setting to localStorage:', error);
    }
  }, [playSound]);

  // Function to add a notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: `manual_${Date.now()}`,
      ...notification,
      read: false,
      timestamp: Date.now()
    };
    
    setNotifications(prev => {
      // Check if this is a duplicate notification received within 5 seconds
      const isDuplicate = prev.some(n => 
        n.message === newNotification.message && 
        n.type === newNotification.type && 
        n.timestamp > newNotification.timestamp - 5000
      );
      
      if (isDuplicate) {
        return prev;
      }
      
      return [newNotification, ...prev];
    });
    
    // Show toast notification for immediate feedback
    try {
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: notification.title || 'New Message',
          description: notification.message,
          duration: 5000,
        });
      });
    } catch (err) {
      console.error('Failed to show toast notification:', err);
    }
  }, []);

  // Mark a specific notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(notifications => notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(notifications => notifications.map(notification => ({ ...notification, read: true })));
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(notifications => notifications.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearNotifications,
    playSound,
    setPlaySound
  };
}
