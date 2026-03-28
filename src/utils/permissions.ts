
import { toast } from 'sonner';

/**
 * Checks if the app is running inside a WebView.
 */
export const isWebView = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const webViewPatterns = [
    /wv\)/i, // Android Chrome WebView
    /WebView/i,
    /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i, // iOS UIWebView/WKWebView
    /Android.*Version\/[0-9]\.[0-9]/i,
  ];
  return webViewPatterns.some(pattern => pattern.test(userAgent));
};

/**
 * Checks if the app is running on a mobile device.
 */
export const isMobile = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

/**
 * In a WebView context, checks for and requests storage permission via a native interface.
 * Returns true if permission is granted, false otherwise.
 */
export const checkStoragePermission = async (language: 'en' | 'hi' = 'en'): Promise<boolean> => {
  if ((window as any).Android && typeof (window as any).Android.requestStoragePermission === 'function') {
    try {
      const result = await (window as any).Android.requestStoragePermission();
      if (result === 'true' || result === true) {
        toast.success(language === 'hi' ? 'स्टोरेज की अनुमति मिल गई।' : 'Storage permission granted.');
        return true;
      } else {
        toast.error(language === 'hi' ? 'डाउनलोड के लिए स्टोरेज की अनुमति आवश्यक है।' : 'Storage permission is required for downloads.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      toast.error(language === 'hi' ? 'अनुमति मांगते समय त्रुटि हुई।' : 'Error requesting permission.');
      return false;
    }
  } else {
    console.log('Not in a WebView with requestStoragePermission, assuming web context.');
    // For standard web browsers, downloads are handled by the browser itself.
    return true;
  }
};


/**
 * Requests notification permission from the user and shows a toast.
 * Avoids asking if permission is already denied to prevent UI blockage.
 */
export const requestNotificationPermission = async (language: 'en' | 'hi' = 'en') => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return;
  }

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
