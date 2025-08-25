
import { useEffect } from 'react';

interface UseHomeEffectsProps {
  authLoading: boolean;
  isLoading: boolean;
  location: any;
  initializeChat: () => void;
  handleNavigationState: () => void;
}

export const useHomeEffects = ({
  authLoading,
  isLoading,
  location,
  initializeChat,
  handleNavigationState
}: UseHomeEffectsProps) => {
  useEffect(() => {
    if (!authLoading) {
      initializeChat();
    }
  }, [authLoading]);

  useEffect(() => {
    if (!isLoading && location.state?.activeChatId) {
      handleNavigationState();
    }
  }, [location.state, isLoading]);
};
