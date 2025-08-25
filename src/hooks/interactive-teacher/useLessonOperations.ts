
import { useCallback } from 'react';
import { generateResponse } from '@/lib/gemini';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TeacherMessage, ConversationContext } from './types';
import { extractFirstSegment } from './messageUtils';
import { buildContinuationPrompt, buildInitialLessonPrompt } from './promptBuilder';
import { EnhancedPointsSystem } from '@/utils/enhancedPointsSystem';
import { StudentActivityTracker } from '@/utils/studentActivityTracker';

interface UseLessonOperationsProps {
  currentContext: ConversationContext | null;
  setCurrentContext: (context: ConversationContext | null) => void;
  messages: TeacherMessage[];
  conversationHistory: string[];
  setConversationHistory: (history: string[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setIsWaitingForStudent: (waiting: boolean) => void;
  addMessage: (message: TeacherMessage) => void;
  updateConversationHistory: (entry: string) => void;
  language: string;
}

export const useLessonOperations = ({
  currentContext,
  setCurrentContext,
  messages,
  conversationHistory,
  setConversationHistory,
  setIsProcessing,
  setIsWaitingForStudent,
  addMessage,
  updateConversationHistory,
  language
}: UseLessonOperationsProps) => {
  const { currentUser } = useAuth();
  
  const startLesson = useCallback(async (lessonPrompt: string, context: Partial<ConversationContext>) => {
    setIsProcessing(true);
    try {
      // Set up the lesson context with better structure
      const newContext: ConversationContext = {
        subject: context.subject || '',
        chapter: context.chapter || '',
        currentTopic: context.chapter || '', // Start with chapter as current topic
        studentName: context.studentName || 'Student',
        priorKnowledge: context.priorKnowledge || 'beginner',
        selectedDifficulty: context.selectedDifficulty || 'medium',
        learningMode: context.learningMode || 'interactive',
        additionalRequirements: context.additionalRequirements || '',
        lessonProgress: [],
        studentResponses: [],
        conversationHistory: []
      };
      setCurrentContext(newContext);

      // Use improved initial lesson prompt
      const initialPrompt = buildInitialLessonPrompt(newContext, language);
      console.log('Starting lesson with improved prompt structure');

      // Use interactive-teacher API key for teacher mode
      const response = await generateResponse(initialPrompt, [], undefined, 'interactive-teacher');
      
      // Extract only the first segment until the first question
      const { firstSegment, hasQuestion } = extractFirstSegment(response);
      
      const message: TeacherMessage = {
        id: `msg_${Date.now()}`,
        content: firstSegment,
        isQuestion: hasQuestion,
        awaitingResponse: hasQuestion,
        timestamp: Date.now()
      };
      
      addMessage(message);
      
      // Initialize conversation history properly
      const initialHistory = [`Teacher: ${firstSegment}`];
      setConversationHistory(initialHistory);
      updateConversationHistory(`Teacher: ${firstSegment}`);
      
      if (hasQuestion) {
        setIsWaitingForStudent(true);
      }

      toast.success(language === 'hi' ? 'Live Teaching शुरू हुआ!' : 'Live Teaching started!');
    } catch (error) {
      console.error('Error starting lesson:', error);
      toast.error(language === 'hi' ? 'पाठ शुरू करने में त्रुटि' : 'Error starting lesson');
    } finally {
      setIsProcessing(false);
    }
  }, [language, setCurrentContext, addMessage, setConversationHistory, updateConversationHistory, setIsProcessing, setIsWaitingForStudent]);

  const submitStudentResponse = useCallback(async (studentAnswer: string) => {
    if (!currentContext) return;

    setIsProcessing(true);
    setIsWaitingForStudent(false);

    try {
      console.log('Processing student response with enhanced context management');
      
      // Add student response to conversation history
      const studentEntry = `Student: ${studentAnswer}`;
      updateConversationHistory(studentEntry);

      // Find the last question for better context
      const lastQuestion = messages.filter(msg => msg.isQuestion).pop();
      
      if (lastQuestion) {
        // Track student's response for analysis
        StudentActivityTracker.trackActivity(currentUser?.uid || 'anonymous', {
          subject: StudentActivityTracker.analyzeMessageForSubject(currentContext.subject + ' ' + currentContext.currentTopic),
          activityType: 'live_teaching',
          content: `Q: ${lastQuestion.content} A: ${studentAnswer}`,
          timeSpent: 120
        });

        // Add student response to context with better tracking
        const newResponse = {
          question: lastQuestion.content,
          answer: studentAnswer,
          timestamp: Date.now()
        };

        // Update context with current conversation state
        const updatedHistory = [...conversationHistory, studentEntry];
        const updatedContext = {
          ...currentContext,
          studentResponses: [...currentContext.studentResponses, newResponse],
          conversationHistory: updatedHistory,
          // Update current topic based on conversation flow
          currentTopic: currentContext.currentTopic || currentContext.chapter
        };
        setCurrentContext(updatedContext);

        // Create enhanced continuation prompt with full context
        const contextPrompt = buildContinuationPrompt(updatedContext, updatedHistory, language);
        
        console.log('Using enhanced prompt with conversation history:', updatedHistory.length, 'messages');

        // Use interactive-teacher API key for teacher mode
        const response = await generateResponse(contextPrompt, [], undefined, 'interactive-teacher');
        
        // Extract first segment until next question
        const { firstSegment, hasQuestion } = extractFirstSegment(response);
        
        const newMessage: TeacherMessage = {
          id: `msg_${Date.now()}`,
          content: firstSegment,
          isQuestion: hasQuestion,
          awaitingResponse: hasQuestion,
          timestamp: Date.now()
        };
        
        addMessage(newMessage);
        updateConversationHistory(`Teacher: ${firstSegment}`);
        
        if (hasQuestion) {
          setIsWaitingForStudent(true);
        } else {
          // Session completed, award participation points
          if (currentUser?.uid) {
            try {
              await EnhancedPointsSystem.awardLiveTeachingParticipationPoints(
                currentUser.uid,
                {
                  subject: StudentActivityTracker.analyzeMessageForSubject(currentContext.subject),
                  topic: currentContext.currentTopic || currentContext.chapter,
                  questionsAsked: 1,
                  correctAnswers: 1,
                  totalQuestions: 1,
                  sessionDuration: messages.length * 120
                }
              );
            } catch (error) {
              console.error("Error awarding live teaching points:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing student response:', error);
      toast.error(language === 'hi' ? 'जवाब प्रोसेस करने में त्रुटि' : 'Error processing response');
    } finally {
      setIsProcessing(false);
    }
  }, [currentContext, messages, conversationHistory, language, setCurrentContext, addMessage, updateConversationHistory, setIsProcessing, setIsWaitingForStudent, currentUser]);

  return {
    startLesson,
    submitStudentResponse
  };
};
