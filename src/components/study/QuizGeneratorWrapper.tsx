import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import QuizGenerator from './QuizGenerator';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';
import MonetagAd from '@/components/ads/MonetagAd';

interface QuizGeneratorWrapperProps {
  onSendMessage?: (message: string) => void;
}

const QuizGeneratorWrapper: React.FC<QuizGeneratorWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      trackGuestFeatureUsage('quiz');
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
      <QuizGenerator onSendMessage={wrappedOnSendMessage} />
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default QuizGeneratorWrapper;
