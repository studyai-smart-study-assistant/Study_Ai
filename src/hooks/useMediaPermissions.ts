
import { useEffect, useRef } from 'react';

/**
 * Requests microphone and camera permissions once when the chat system loads.
 * This ensures seamless calling experience later.
 */
export const useMediaPermissions = () => {
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const requestPermissions = async () => {
      try {
        // Request mic + camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // Stop all tracks immediately - we just needed the permission
        stream.getTracks().forEach(track => track.stop());
        console.log('Media permissions granted');
      } catch (err) {
        // Try audio only if video fails
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getTracks().forEach(track => track.stop());
          console.log('Audio permission granted (video denied)');
        } catch {
          console.log('Media permissions denied');
        }
      }
    };

    // Delay slightly so it doesn't block initial render
    setTimeout(requestPermissions, 2000);
  }, []);
};
