
// Audio utilities with better error handling
export const createNotificationSound = (): HTMLAudioElement | null => {
  try {
    if (!('Audio' in window)) {
      console.warn('Audio API not supported in this browser');
      return null;
    }

    // Create a simple notification sound using Web Audio API as fallback
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for notification sound
    const createBeepSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    // Return a mock audio element that uses Web Audio API
    return {
      play: () => {
        try {
          createBeepSound();
          return Promise.resolve();
        } catch (error) {
          console.warn('Could not play notification sound:', error);
          return Promise.reject(error);
        }
      },
      cloneNode: () => ({ play: createBeepSound }),
      volume: 0.7,
      load: () => {},
      addEventListener: () => {}
    } as any;

  } catch (error) {
    console.error('Error creating notification sound:', error);
    return null;
  }
};

// Enhanced audio support detection
export const checkAudioSupport = (): boolean => {
  return 'Audio' in window || 'AudioContext' in window || 'webkitAudioContext' in window;
};
