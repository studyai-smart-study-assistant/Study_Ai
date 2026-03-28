
import { toast } from 'sonner';

/**
 * Requests notification permission from the user and shows a toast.
 * Avoids asking if permission is already denied to prevent UI blockage.
 */
export const requestNotificationPermission = async (language: 'en' | 'hi' = 'en') => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return;
  }

  // Don't re-ask if permission is already denied.
  if (Notification.permission === 'denied') {
    console.log('Notification permission was previously denied.');
    return;
  }
  
  if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success(language === 'hi' ? 'सूचनाएं चालू कर दी गई हैं!' : 'Notifications enabled!');
    } else {
      console.log('Notification permission request dismissed.');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

/**
 * Requests microphone permission on-demand.
 * Returns a MediaStream on success, or null on failure.
 */
export const requestMicrophonePermission = async (language: 'en' | 'hi' = 'en'): Promise<MediaStream | null> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: true, 
                noiseSuppression: true, 
                autoGainControl: true 
            } 
        });
        return stream;
    } catch (err: any) {
        console.error('Microphone access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            toast.error(language === 'hi' ? 'माइक्रोफ़ोन की अनुमति आवश्यक है।' : 'Microphone access is required.');
        } else {
            toast.error(language === 'hi' ? 'माइक्रोफ़ोन एक्सेस विफल।' : 'Failed to access microphone.');
        }
        return null;
    }
};

/**
 * Requests camera permission on-demand.
 * Returns a MediaStream on success, or null on failure.
 */
export const requestCameraPermission = async (facingMode: 'user' | 'environment' = 'environment', language: 'en' | 'hi' = 'en'): Promise<MediaStream | null> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        return stream;
    } catch (err: any) {
        console.error('Camera access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            toast.error(language === 'hi' ? 'कैमरे की अनुमति आवश्यक है।' : 'Camera access is required.');
        } else {
            toast.error(language === 'hi' ? 'कैमरा एक्सेस विफल।' : 'Failed to access camera.');
        }
        return null;
    }
};
