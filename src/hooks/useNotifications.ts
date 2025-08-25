
import { useState, useEffect, useRef, useCallback } from 'react';
import { onMessage } from '@/lib/firebase';

// Define the notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  type?: 'group' | 'message' | 'system'; // Added type property
  groupId?: string; // Added groupId property
  chatId?: string; // Added chatId property
  senderName?: string; // Added senderName property
  isRead?: boolean; // For compatibility with existing code
}

// Sample notifications for demonstration
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'पाठ्यक्रम अपडेट',
    message: 'आपका गणित का पाठ्यक्रम अपडेट किया गया है। नए अध्याय जोड़े गए हैं।',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    type: 'system'
  },
  {
    id: '2',
    title: 'अध्ययन अनुस्मारक',
    message: 'आपका दैनिक अध्ययन लक्ष्य अभी तक पूरा नहीं हुआ है। आज के लिए 30 मिनट अध्ययन बाकी है।',
    read: false,
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    type: 'system'
  },
  {
    id: '3',
    title: 'क्विज़ परिणाम',
    message: 'बधाई हो! आपने विज्ञान क्विज़ में 90% स्कोर किया है। अपने परिणाम देखें।',
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    type: 'system'
  },
  {
    id: '4',
    title: 'शिक्षक संदेश',
    message: 'आपके शिक्षक श्री कुमार ने आपके प्रोजेक्ट पर टिप्पणी छोड़ी है। जवाब दें।',
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    type: 'message',
    senderName: 'Kumar'
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      // Try to load notifications from localStorage
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
      console.error('Error loading sound setting from localStorage:', error);
      return true;
    }
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  
  // Track processed message IDs to prevent duplicate notifications
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

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
  
  // Clean up processed IDs periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const oldIds = Array.from(processedMessageIdsRef.current)
        .filter(id => {
          const [, timestamp] = id.split('-time-');
          return parseInt(timestamp) < fiveMinutesAgo;
        });
      
      oldIds.forEach(id => processedMessageIdsRef.current.delete(id));
    }, 60000); // Clean up every minute
    
    return () => clearInterval(cleanup);
  }, []);

  // Setup message listener function with retry logic
  const setupMessageListener = useCallback(() => {
    try {
      // Silent setup - no logging needed for better performance
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      const unsubscribe = onMessage((messageInfo) => {
        // Generate a unique ID for this message
        const uniqueId = `${messageInfo.chatId}-${messageInfo.text}-time-${Date.now()}`;
        
        // Check if we've already processed this exact message recently
        if (processedMessageIdsRef.current.has(uniqueId)) {
          console.log("Ignoring duplicate notification:", messageInfo);
          return;
        }
        
        // Add to processed IDs
        processedMessageIdsRef.current.add(uniqueId);
        
        // Create notification from message
        console.log("Received message notification:", messageInfo);
        
        const newNotification: Notification = {
          id: `msg_${Date.now()}`,
          title: messageInfo.isGroup 
            ? `${messageInfo.groupName || 'Campus Group'}: ${messageInfo.senderName || 'Someone'}`
            : `${messageInfo.senderName || 'Someone'}`,
          message: messageInfo.text,
          read: false,
          timestamp: Date.now(),
          type: messageInfo.isGroup ? 'group' : 'message',
          groupId: messageInfo.isGroup ? messageInfo.chatId : undefined,
          chatId: messageInfo.isGroup ? undefined : messageInfo.chatId,
          senderName: messageInfo.senderName
        };
        
        addNotification(newNotification);
        
        // Reset retry counter on successful message
        retryCountRef.current = 0;
      });
      
      unsubscribeRef.current = unsubscribe;
      
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up message listener:', err);
      return null;
    }
  }, []);

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
        console.log("Ignoring duplicate notification");
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
    
    // Play notification sound if enabled
    if (playSound) {
      try {
        // Use the notificationService to play sound (it has better error handling)
        import('@/utils/notificationService').then(notificationService => {
          const data = {
            title: notification.title || 'Notification',
            message: notification.message
          };
          notificationService.showNotification(data);
        }).catch(err => {
          console.error('Failed to import notification service:', err);
          // Fallback
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = 0.7;
          audio.play().catch(err => {
            console.error('Failed to play notification sound:', err);
          });
        });
      } catch (err) {
        console.error('Failed to play notification sound:', err);
      }
    }
  }, [playSound]);

  // Listen for new messages from Firebase for real-time notifications
  useEffect(() => {
    const setupListener = () => {
      try {
        const unsubscribe = setupMessageListener();
        
        if (!unsubscribe) {
          // Retry setup if it failed
          if (retryCountRef.current < 3) {
            console.log(`Retrying message listener setup (${retryCountRef.current + 1}/3)...`);
            retryCountRef.current += 1;
            
            retryTimeoutRef.current = setTimeout(() => {
              setupListener();
            }, 2000 * retryCountRef.current); // Exponential backoff
          } else {
            console.error("Failed to set up message listener after multiple retries");
          }
        } else {
          // Reset retry counter on successful setup
          retryCountRef.current = 0;
        }
      } catch (error) {
        console.error("Error in setupListener:", error);
      }
    };
    
    setupListener();
    
    // Clean up listener when component unmounts
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [setupMessageListener]);

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
