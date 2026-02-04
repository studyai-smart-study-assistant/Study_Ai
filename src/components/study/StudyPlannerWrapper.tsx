import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature } from '@/utils/points/featureLocking';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import { toast } from 'sonner';
import StudyPlanner from './StudyPlanner';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

interface StudyPlannerWrapperProps {
  onSendMessage?: (message: string) => void;
}

const StudyPlannerWrapper: React.FC<StudyPlannerWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    // For logged-in users, deduct credits
    if (currentUser) {
      const result = await deductPointsForFeature(currentUser.uid, 'study_plan');
      
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      
      toast.success(result.message);
    } else {
      // For guests, track usage and show prompt if threshold reached
      trackGuestFeatureUsage('studyPlan');
      
      if (shouldShowSignupPrompt()) {
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
      <StudyPlanner onSendMessage={wrappedOnSendMessage} />
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default StudyPlannerWrapper;
