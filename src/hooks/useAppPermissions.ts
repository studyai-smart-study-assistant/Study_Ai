import { useEffect, useRef } from 'react';
import { requestNotificationPermission, requestMicrophonePermission } from '@/utils/permissions';

/**
 * Requests essential app permissions once per session.
 * Only asks for notifications and microphone — camera/storage requested on-demand.
 */
export function useAppPermissions() {
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const requestEssentialPermissions = async () => {
      // Small delay so app renders first
      await new Promise(r => setTimeout(r, 2000));

      // Request notification permission (non-blocking)
      try {
        await requestNotificationPermission();
      } catch {
        // Silently ignore
      }

      // Request microphone permission (needed for STT features)
      try {
        await requestMicrophonePermission();
      } catch {
        // Silently ignore
      }
    };

    requestEssentialPermissions();
  }, []);
}
