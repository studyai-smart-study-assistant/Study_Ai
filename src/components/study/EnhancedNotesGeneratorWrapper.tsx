import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature } from '@/utils/points/featureLocking';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import { toast } from 'sonner';
import EnhancedNotesGenerator from './EnhancedNotesGenerator';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

interface EnhancedNotesGeneratorWrapperProps {
  onSendMessage?: (message: string) => void;
}

const EnhancedNotesGeneratorWrapper: React.FC<EnhancedNotesGeneratorWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    // For logged-in users, deduct credits
    if (currentUser) {
      const result = await deductPointsForFeature(currentUser.uid, 'notes_generation');
      
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      
      toast.success(result.message);
    } else {
      // For guests, track usage and show prompt if threshold reached
      trackGuestFeatureUsage('notes');
      
      if (shouldShowSignupPrompt()) {
        // Show prompt after a delay so it doesn't interrupt
        setTimeout(() => setShowSignupPrompt(true), 2000);
      }
    }
    
    // Always allow the feature to work
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
