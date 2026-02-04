
import React, { useState, useEffect } from 'react';
import { TeacherModeProps } from './teacher/types';
import TeacherModeHeader from './teacher/TeacherModeHeader';
import TeacherModeTabs from './teacher/TeacherModeTabs';
import { ComprehensiveActivityTracker } from '@/utils/comprehensiveActivityTracker';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature } from '@/utils/points/featureLocking';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import { toast } from 'sonner';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

const TeacherMode: React.FC<TeacherModeProps> = ({ onSendMessage }) => {
  const [useVoiceResponse, setUseVoiceResponse] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [learningMode, setLearningMode] = useState('interactive');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { currentUser } = useAuth();

  const handleSendMessage = async (message: string) => {
    // For logged-in users, deduct credits
    if (currentUser) {
      const result = await deductPointsForFeature(currentUser.uid, 'teacher_mode');
      
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      
      toast.success(result.message);
      
      // Track the start time of interaction
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }

      // Track interactive teaching activity
      const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 30;
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid, 
        message, 
        timeSpent
      );
    } else {
      // For guests, track usage and show prompt if threshold reached
      trackGuestFeatureUsage('chat');
      
      if (shouldShowSignupPrompt()) {
        setTimeout(() => setShowSignupPrompt(true), 2000);
      }
    }

    // Send the message - always allow
    onSendMessage(message);
  };

  // Reset session time when component unmounts or user changes
  useEffect(() => {
    setSessionStartTime(Date.now());
    
    return () => {
      setSessionStartTime(null);
    };
  }, [currentUser]);

  return (
    <>
      <div className="w-full space-y-6">
        <TeacherModeHeader />
        
        <TeacherModeTabs
          onSendMessage={handleSendMessage}
          useVoiceResponse={useVoiceResponse}
          setUseVoiceResponse={setUseVoiceResponse}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          learningMode={learningMode}
          setLearningMode={setLearningMode}
        />
      </div>
      
      <SignupPromptDialog 
        open={showSignupPrompt} 
        onOpenChange={setShowSignupPrompt} 
      />
    </>
  );
};

export default TeacherMode;
