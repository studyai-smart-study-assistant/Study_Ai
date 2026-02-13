import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import StudyPlanner from './StudyPlanner';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';
import MonetagAd from '@/components/ads/MonetagAd';

interface StudyPlannerWrapperProps {
  onSendMessage?: (message: string) => void;
}

const StudyPlannerWrapper: React.FC<StudyPlannerWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      trackGuestFeatureUsage('studyPlan');
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
      <MonetagAd />
      <StudyPlanner onSendMessage={wrappedOnSendMessage} />
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default StudyPlannerWrapper;
