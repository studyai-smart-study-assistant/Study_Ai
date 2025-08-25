
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useFloatingTimer = () => {
  const { currentUser } = useAuth();
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const activeSession = localStorage.getItem(`${currentUser.uid}_active_study_session`);
      setHasActiveSession(activeSession === 'true');
    }
  }, [currentUser]);

  return {
    hasActiveSession,
  };
};
