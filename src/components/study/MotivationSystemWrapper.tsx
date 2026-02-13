import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import MotivationSystem from './MotivationSystem';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

interface MotivationSystemWrapperProps {
  onSendMessage: (message: string) => void;
}

const MotivationSystemWrapper: React.FC<MotivationSystemWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      trackGuestFeatureUsage('chat');
      if (shouldShowSignupPrompt()) {
        setTimeout(() => setShowSignupPrompt(true), 2000);
      }
    }
    
    onSendMessage(message);
  };

  return (
    <>
      <MotivationSystem onSendMessage={wrappedOnSendMessage} />
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default MotivationSystemWrapper;
