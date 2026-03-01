
import React, { useState } from 'react';
import { useInteractiveTeacher } from '@/hooks/interactive-teacher';
import { useAuth } from '@/contexts/AuthContext';
import { ComprehensiveActivityTracker } from '@/utils/comprehensiveActivityTracker';
import { trackGuestFeatureUsage, shouldShowSignupPrompt } from '@/utils/guestUsageTracker';
import InteractiveTeacherSetup from './interactive-teacher/InteractiveTeacherSetup';
import InteractiveTeacherLesson from './interactive-teacher/InteractiveTeacherLesson';
import InteractiveTeacherHistory from './interactive-teacher/InteractiveTeacherHistory';
import SignupPromptDialog from '@/components/home/SignupPromptDialog';

interface InteractiveTeacherModeProps {
  onSendMessage: (message: string) => void;
}

const InteractiveTeacherMode: React.FC<InteractiveTeacherModeProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const {
    messages,
    currentContext,
    isWaitingForStudent,
    isProcessing,
    startLesson,
    submitStudentResponse,
    resetLesson
  } = useInteractiveTeacher();

  const handleStartLesson = async (prompt: string, context: any) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid,
        prompt,
        0
      );
    } else {
      trackGuestFeatureUsage('chat');
      if (shouldShowSignupPrompt()) {
        setTimeout(() => setShowSignupPrompt(true), 2000);
      }
    }
    
    startLesson(prompt, context);
  };

  const handleSubmitAnswer = (answer: string) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid,
        answer,
        60
      );
    }
    
    submitStudentResponse(answer);
  };

  if (messages.length > 0) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex justify-end">
            <InteractiveTeacherHistory />
          </div>
          
          <InteractiveTeacherLesson
            messages={messages}
            currentContext={currentContext}
            isWaitingForStudent={isWaitingForStudent}
            isProcessing={isProcessing}
            onResetLesson={resetLesson}
            onShowQuestionDialog={() => {}}
            onSubmitAnswer={handleSubmitAnswer}
          />
          <SignupPromptDialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt} />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InteractiveTeacherHistory />
      </div>
      
      <InteractiveTeacherSetup
        onStartLesson={handleStartLesson}
        isProcessing={isProcessing}
      />
      <SignupPromptDialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt} />
    </div>
  );
};

export default InteractiveTeacherMode;