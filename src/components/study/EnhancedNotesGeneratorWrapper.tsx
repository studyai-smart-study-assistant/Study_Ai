import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import EnhancedNotesGenerator from './EnhancedNotesGenerator';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

interface EnhancedNotesGeneratorWrapperProps {
  onSendMessage?: (message: string) => void;
}

const EnhancedNotesGeneratorWrapper: React.FC<EnhancedNotesGeneratorWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      trackGuestFeatureUsage('notes');
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
      <EnhancedNotesGenerator onSendMessage={wrappedOnSendMessage} />
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default EnhancedNotesGeneratorWrapper;