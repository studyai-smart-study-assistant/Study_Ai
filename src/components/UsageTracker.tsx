
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  startRealTimeUsageTracking, 
  stopRealTimeUsageTracking, 
  resumeRealTimeTracking 
} from '@/utils/realTimeUsageTracker';

const UsageTracker = () => {
  const { currentUser } = useAuth();

  // Start real-time usage tracking when user is authenticated
  useEffect(() => {
    if (currentUser) {
      console.log('🕒 Starting optimized usage tracking for user:', currentUser.uid);
      
      // Resume any existing tracking session
      resumeRealTimeTracking(currentUser.uid);
      
      // Start fresh tracking
      startRealTimeUsageTracking(currentUser.uid);
    }
    
    return () => {
      if (currentUser) {
        console.log('🕒 Stopping usage tracking for user:', currentUser.uid);
        stopRealTimeUsageTracking(currentUser.uid);
      }
    };
  }, [currentUser]);

  // Handle page visibility changes for accurate tracking
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🕒 App backgrounded, pausing tracking');
        stopRealTimeUsageTracking(currentUser.uid);
      } else {
        console.log('🕒 App foregrounded, resuming tracking');
        resumeRealTimeTracking(currentUser.uid);
        startRealTimeUsageTracking(currentUser.uid);
      }
    };

    const handleBeforeUnload = () => {
      console.log('🕒 App closing, saving final usage data');
      stopRealTimeUsageTracking(currentUser.uid);
    };

    // Optimized event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  return null; // This component doesn't render anything
};

export default UsageTracker;
