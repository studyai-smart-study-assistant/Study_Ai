import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserPresence = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    console.log('Updating user presence for:', currentUser.uid);

    // Set user as online
    const setOnline = async () => {
      try {
        await supabase
          .from('campus_users')
          .upsert({
            firebase_uid: currentUser.uid,
            status: 'online',
            last_seen: new Date().toISOString(),
            display_name: currentUser.displayName || `User_${currentUser.uid.substring(0, 5)}`,
            email: currentUser.email,
            avatar_url: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`
          });
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    };

    // Set user as offline
    const setOffline = async () => {
      try {
        await supabase
          .from('campus_users')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString()
          })
          .eq('firebase_uid', currentUser.uid);
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    };

    // Set online initially
    setOnline();

    // Set up heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      setOnline();
    }, 30000); // Update every 30 seconds

    // Set offline on page unload
    const handleBeforeUnload = () => {
      setOffline();
    };

    // Set offline when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
    };
  }, [currentUser]);
};