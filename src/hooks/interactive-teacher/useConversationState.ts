
import { useState, useRef } from 'react';
import { TeacherMessage, ConversationContext } from './types';
import { useInteractiveTeacherHistory } from './useInteractiveTeacherHistory';

export const useConversationState = () => {
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [currentContext, setCurrentContext] = useState<ConversationContext | null>(null);
  const [isWaitingForStudent, setIsWaitingForStudent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Enhanced tracking to prevent duplicates and manage conversation flow
  const saveInProgress = useRef(false);
  const lastSavedMessageCount = useRef(0);
  const lastSaveTimestamp = useRef(0);
  const hasSavedSession = useRef(false);
  const conversationStartTime = useRef<number | null>(null);
  
  const { saveChat, updateChat } = useInteractiveTeacherHistory();

  const addMessage = (message: TeacherMessage) => {
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      
      // Track conversation start time
      if (!conversationStartTime.current) {
        conversationStartTime.current = Date.now();
      }
      
      console.log('Message added to conversation, total messages:', updatedMessages.length);
      return updatedMessages;
    });
  };

  const updateConversationHistory = (entry: string) => {
    setConversationHistory(prev => {
      const updatedHistory = [...prev, entry];
      console.log('Conversation history updated, total entries:', updatedHistory.length);
      return updatedHistory;
    });
  };

  const saveCurrentChat = async (messagesToSave?: TeacherMessage[]) => {
    const currentMessages = messagesToSave || messages;
    const now = Date.now();
    
    // Enhanced duplicate prevention with better logic
    if (saveInProgress.current || 
        !currentContext || 
        currentMessages.length === 0 ||
        (currentChatId && lastSavedMessageCount.current === currentMessages.length && 
         now - lastSaveTimestamp.current < 10000)) { // 10 second buffer for same message count
      console.log('Skipping save - duplicate prevention or no new content');
      return currentChatId;
    }

    try {
      saveInProgress.current = true;
      lastSaveTimestamp.current = now;
      
      console.log('Saving interactive teacher chat with', currentMessages.length, 'messages and conversation history:', conversationHistory.length, 'entries');
      
      const priorKnowledgeText = (currentContext as any).priorKnowledge === 'beginner' ? 'शुरुआती' : 'अनुभवी';
      const title = `${currentContext.subject} - ${currentContext.chapter} (${priorKnowledgeText})`;
      
      let chatId = currentChatId;
      
      if (currentChatId && hasSavedSession.current && lastSavedMessageCount.current > 0) {
        // Update existing chat only if there are new messages
        if (currentMessages.length > lastSavedMessageCount.current) {
          console.log('Updating existing chat with new messages:', currentChatId);
          await updateChat(currentChatId, currentMessages);
          chatId = currentChatId;
        }
      } else {
        // Create new chat for first save or when no current chat ID
        console.log('Creating new chat session');
        chatId = await saveChat({
          title,
          subject: currentContext.subject,
          chapter: currentContext.chapter,
          studentName: currentContext.studentName || 'Student',
          messages: currentMessages,
          context: {
            ...currentContext,
            conversationHistory, // Include full conversation history
            sessionStartTime: conversationStartTime.current
          }
        });
        
        if (!currentChatId) {
          setCurrentChatId(chatId);
        }
        hasSavedSession.current = true;
      }
      
      lastSavedMessageCount.current = currentMessages.length;
      console.log('Chat saved/updated successfully with', currentMessages.length, 'messages:', chatId);
      return chatId;
    } catch (error) {
      console.error('Error saving chat:', error);
    } finally {
      saveInProgress.current = false;
    }
  };

  const resetState = () => {
    console.log('Resetting conversation state');
    setMessages([]);
    setCurrentContext(null);
    setIsWaitingForStudent(false);
    setIsProcessing(false);
    setConversationHistory([]);
    setCurrentChatId(null);
    saveInProgress.current = false;
    lastSavedMessageCount.current = 0;
    lastSaveTimestamp.current = 0;
    hasSavedSession.current = false;
    conversationStartTime.current = null;
  };

  return {
    messages,
    setMessages,
    currentContext,
    setCurrentContext,
    isWaitingForStudent,
    setIsWaitingForStudent,
    isProcessing,
    setIsProcessing,
    conversationHistory,
    setConversationHistory,
    currentChatId,
    addMessage,
    updateConversationHistory,
    saveCurrentChat,
    resetState
  };
};
