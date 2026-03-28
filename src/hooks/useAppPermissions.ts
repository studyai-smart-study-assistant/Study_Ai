
import { useEffect, useRef } from 'react';
import { requestNotificationPermission } from '@/utils/permissions';

/**
 * Requests non-intrusive app permissions once per session.
 * Only asks for notifications. Other permissions (mic, camera) are requested on-demand.
 */
export function useAppPermissions() {
  const hasRequested = useRef(false);

  useEffect(() => {
    // Ensure this runs only once per session
    if (hasRequested.current) {
      return;
    }
    hasRequested.current = true;

    // After a short delay, ask for notification permission.
    // We are NOT asking for microphone or camera here.
    const timer = setTimeout(() => {
      console.log('Requesting notification permission...');
      requestNotificationPermission();
    }, 10000); // 10-second delay

    return () => clearTimeout(timer);
  }, []);
}
