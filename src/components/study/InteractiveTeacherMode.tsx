
import React from 'react';
import { useInteractiveTeacher } from '@/hooks/interactive-teacher';
import { useAuth } from '@/contexts/AuthContext';
import { ComprehensiveActivityTracker } from '@/utils/comprehensiveActivityTracker';
import InteractiveTeacherSetup from './interactive-teacher/InteractiveTeacherSetup';
import InteractiveTeacherLesson from './interactive-teacher/InteractiveTeacherLesson';
import InteractiveTeacherHistory from './interactive-teacher/InteractiveTeacherHistory';

interface InteractiveTeacherModeProps {
  onSendMessage: (message: string) => void;
}

const InteractiveTeacherMode: React.FC<InteractiveTeacherModeProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const {
    messages,
    currentContext,
    isWaitingForStudent,
    isProcessing,
    startLesson,
    submitStudentResponse,
    resetLesson
  } = useInteractiveTeacher();

  const handleStartLesson = (prompt: string, context: any) => {
    // Track lesson start
    if (currentUser) {
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid,
        prompt,
        0 // Initial tracking
      );
    }
    
    startLesson(prompt, context);
    console.log('Interactive lesson started and tracked');
  };

  const handleSubmitAnswer = (answer: string) => {
    // Track student response
    if (currentUser) {
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid,
        answer,
        60 // Approximate time for response
      );
    }
    
    submitStudentResponse(answer);
    console.log('Student response tracked:', answer.substring(0, 30) + '...');
  };

  if (messages.length > 0) {
    return (
      <div className="space-y-4">
        {/* History Access Button */}
        <div className="flex justify-end">
          <InteractiveTeacherHistory />
        </div>
        
        <InteractiveTeacherLesson
          messages={messages}
          currentContext={currentContext}
          isWaitingForStudent={isWaitingForStudent}
          isProcessing={isProcessing}
          onResetLesson={resetLesson}
          onShowQuestionDialog={() => {}} // No longer needed
          onSubmitAnswer={handleSubmitAnswer}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* History Access Button - Show even when no active lesson */}
      <div className="flex justify-end">
        <InteractiveTeacherHistory />
      </div>
      
      <InteractiveTeacherSetup
        onStartLesson={handleStartLesson}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default InteractiveTeacherMode;
