import { createNotificationSound, checkAudioSupport } from './audioUtils';

/**
 * A unified notification service that works across web browsers and WebView
 */

// Define notification types
export interface NotificationData {
  title: string;
  message: string;
  icon?: string;
  duration?: number;
}

// Keep track of active notifications
let activeNotifications: NotificationData[] = [];
// Track notification sound loading status
let notificationSoundLoaded = false;
let notificationSound: HTMLAudioElement | null = null;

// Enhanced audio preloading with Web Audio API fallback
const preloadNotificationSound = () => {
  try {
    if (!checkAudioSupport()) {
      console.log('Audio not supported in this browser');
      return;
    }

    // Try to create audio element first
    try {
      notificationSound = new Audio();
      notificationSound.preload = 'auto';
      
      // Try to load a simple data URL sound as fallback
      const silentAudio = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+/wwisFO5vY7MZ5KwUme8zy1n4wCAl7xu7Ijj8RLGm/5qM7GBN3x+7QciIGKYHU9tuFNQoOUKjr77hYFg=';
      notificationSound.src = silentAudio;
      
      notificationSound.addEventListener('canplaythrough', () => {
        console.log('Notification audio initialized successfully');
        notificationSoundLoaded = true;
      }, { once: true });
      
      notificationSound.addEventListener('error', () => {
        console.log('Standard audio failed, using Web Audio API fallback');
        notificationSound = createNotificationSound();
        notificationSoundLoaded = !!notificationSound;
      }, { once: true });
      
      notificationSound.load();
      
    } catch (audioError) {
      console.log('Audio element creation failed, using Web Audio API');
      notificationSound = createNotificationSound();
      notificationSoundLoaded = !!notificationSound;
    }
    
  } catch (err) {
    console.error('Error initializing notification sound:', err);
    notificationSoundLoaded = false;
    notificationSound = null;
  }
};

// Initialize sound on first load
preloadNotificationSound();

// Function to check if we're in a WebView
export const isInWebView = (): boolean => {
  const ua = navigator.userAgent;
  return /wv/.test(ua) || /Android.*Version\/[0-9]/.test(ua) || window.Android !== undefined;
};

// Check if browser notifications are supported and permitted (without requesting)
export const areBrowserNotificationsSupported = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  
  // Only return true if permission is already granted, don't request it
  return Notification.permission === "granted";
};

// Enhanced notification sound with better error handling
const playNotificationSound = (): void => {
  if (!checkAudioSupport()) {
    console.log('Audio not supported, skipping sound');
    return;
  }
  
  try {
    if (notificationSoundLoaded && notificationSound) {
      const soundPromise = notificationSound.play();
      
      if (soundPromise && typeof soundPromise.then === 'function') {
        soundPromise
          .then(() => console.log('Notification sound played successfully'))
          .catch(err => {
            console.warn('Could not play notification sound (autoplay restriction):', err.message);
          });
      }
    } else {
      console.log('Notification sound not ready, skipping');
    }
  } catch (err) {
    console.warn('Error playing notification sound:', err);
  }
};

// Show a notification using the best available method
export const showNotification = async (data: NotificationData): Promise<void> => {
  activeNotifications.push(data);
  
  // Play sound with enhanced error handling
  playNotificationSound();
  
  // First try native WebView bridge if available
  if (window.Android?.showNotification) {
    console.log('Using Android WebView bridge for notification');
    window.Android.showNotification(data.title, data.message);
    return;
  }
  
  // Try browser notifications only if we can use them safely
  try {
    const canUseSystemNotifications = await areBrowserNotificationsSupported();
    if (canUseSystemNotifications) {
      console.log('Using browser notification API');
      const notification = new Notification(data.title, {
        body: data.message,
        icon: data.icon || '/vite.svg',
        tag: 'study-ai-notification', // Prevent duplicates
        requireInteraction: false,
        silent: false
      });
      
      if (data.duration) {
        setTimeout(() => notification.close(), data.duration);
      }
      
      return;
    }
  } catch (error) {
    console.log('Browser notification not available, skipping:', error.message);
  }

  console.log('Using UI notification fallback');
};

// Get current active notifications
export const getActiveNotifications = (): NotificationData[] => {
  return [...activeNotifications];
};

// Clear a specific notification
export const clearNotification = (index: number): void => {
  if (index >= 0 && index < activeNotifications.length) {
    activeNotifications.splice(index, 1);
  }
};

// Clear all notifications
export const clearAllNotifications = (): void => {
  activeNotifications = [];
};

// Declare WebView interface for TypeScript
declare global {
  interface Window {
    Android?: {
      showNotification: (title: string, message: string) => void;
    };
  }
}
