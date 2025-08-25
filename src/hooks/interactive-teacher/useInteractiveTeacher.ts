
import { useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConversationState } from './useConversationState';
import { useLessonOperations } from './useLessonOperations';

export const useInteractiveTeacher = () => {
  const { language } = useLanguage();
  const {
    messages,
    setMessages,
    currentContext,
    isWaitingForStudent,
    isProcessing,
    conversationHistory,
    currentChatId,
    setCurrentContext,
    setIsProcessing,
    setIsWaitingForStudent,
    addMessage,
    updateConversationHistory,
    saveCurrentChat,
    resetState
  } = useConversationState();

  const { startLesson: startLessonOperation, submitStudentResponse } = useLessonOperations({
    currentContext,
    setCurrentContext,
    messages,
    conversationHistory,
    setConversationHistory: () => {}, // Not needed as we use updateConversationHistory
    setIsProcessing,
    setIsWaitingForStudent,
    addMessage,
    updateConversationHistory,
    language
  });

  // Controlled auto-save - only save when there's significant conversation progress
  useEffect(() => {
    const shouldAutoSave = () => {
      // Only auto-save when there are multiple meaningful exchanges
      return messages.length >= 6 && currentContext && messages.length % 4 === 0;
    };

    if (shouldAutoSave()) {
      const timer = setTimeout(() => {
        console.log('Auto-saving due to conversation progress...');
        saveCurrentChat();
      }, 3000); // Longer delay to prevent frequent saves

      return () => clearTimeout(timer);
    }
  }, [messages.length, currentContext, saveCurrentChat]);

  // Save on page unload - but only if not already saved recently
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 2 && currentContext) {
        try {
          saveCurrentChat();
        } catch (error) {
          console.error('Error saving on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messages, currentContext, saveCurrentChat]);

  const startLesson = useCallback((prompt: string, context: any, savedMessages?: any[]) => {
    if (savedMessages && savedMessages.length > 0) {
      // Load existing conversation
      setMessages(savedMessages);
      setCurrentContext(context);
      setIsWaitingForStudent(true);
      console.log('Loaded existing conversation with', savedMessages.length, 'messages');
    } else {
      // Start new lesson
      startLessonOperation(prompt, context);
    }
  }, [startLessonOperation, setMessages, setCurrentContext, setIsWaitingForStudent]);

  const resetLesson = useCallback(async () => {
    // Save current session before resetting only if there's substantial content
    if (messages.length > 3 && currentContext) {
      console.log('Saving session before reset...');
      await saveCurrentChat();
    }
    resetState();
  }, [resetState, messages.length, currentContext, saveCurrentChat]);

  return {
    messages,
    currentContext,
    isWaitingForStudent,
    isProcessing,
    startLesson,
    submitStudentResponse,
    resetLesson,
    saveCurrentChat,
    conversationHistory,
    currentChatId
  };
};
