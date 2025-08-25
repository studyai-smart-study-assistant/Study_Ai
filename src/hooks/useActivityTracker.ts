
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ComprehensiveActivityTracker } from '@/utils/comprehensiveActivityTracker';

export const useActivityTracker = () => {
  const { currentUser } = useAuth();

  const trackQuizCompletion = useCallback((
    subject: string,
    correctAnswers: number,
    totalQuestions: number,
    timeSpent: number
  ) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackQuizActivity(
        currentUser.uid,
        subject,
        correctAnswers,
        totalQuestions,
        timeSpent
      );
    }
  }, [currentUser]);

  const trackNotesCreation = useCallback((
    subject: string,
    content: string,
    timeSpent: number
  ) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackNotesCreation(
        currentUser.uid,
        subject,
        content,
        timeSpent
      );
    }
  }, [currentUser]);

  const trackChapterReading = useCallback((
    chapterName: string,
    timeSpent: number
  ) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackChapterReading(
        currentUser.uid,
        chapterName,
        timeSpent
      );
    }
  }, [currentUser]);

  const trackStudySession = useCallback((
    subject: string,
    sessionData: any
  ) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackStudySession(
        currentUser.uid,
        subject,
        sessionData
      );
    }
  }, [currentUser]);

  const trackInteractiveTeaching = useCallback((
    messageContent: string,
    timeSpent: number
  ) => {
    if (currentUser) {
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid,
        messageContent,
        timeSpent
      );
    }
  }, [currentUser]);

  return {
    trackQuizCompletion,
    trackNotesCreation,
    trackChapterReading,
    trackStudySession,
    trackInteractiveTeaching,
    isTracking: !!currentUser
  };
};
