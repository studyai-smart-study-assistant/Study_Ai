import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import HomeworkAssistant from './HomeworkAssistant';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

interface HomeworkAssistantWrapperProps {
  onSendMessage?: (message: string) => void;
}

const HomeworkAssistantWrapper: React.FC<HomeworkAssistantWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      trackGuestFeatureUsage('homework');
      if (shouldShowSignupPrompt()) {
        setTimeout(() => setShowSignupPrompt(true), 2000);
      }
    }
    
    if (onSendMessage) {
      onSendMessage(message);
    }
  };

  return (
    <>
      <HomeworkAssistant onSendMessage={wrappedOnSendMessage} />
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default HomeworkAssistantWrapper;
