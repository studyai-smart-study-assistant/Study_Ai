
import { useEffect } from 'react';

interface UseHomeEffectsProps {
  authLoading: boolean;
  isLoading: boolean;
  location: { state?: { activeChatId?: string } | null };
  currentUser: { uid?: string } | null;
  initializeChat: () => void;
  handleNavigationState: () => void;
}

export const useHomeEffects = ({
  authLoading,
  isLoading,
  location,
  currentUser,
  initializeChat,
  handleNavigationState
}: UseHomeEffectsProps) => {
  useEffect(() => {
    if (!authLoading && currentUser) {
      initializeChat();
    }
  }, [authLoading, currentUser, initializeChat]);

  useEffect(() => {
    if (!isLoading && currentUser && location.state?.activeChatId) {
      handleNavigationState();
    }
  }, [location.state, isLoading, currentUser, handleNavigationState]);
};
