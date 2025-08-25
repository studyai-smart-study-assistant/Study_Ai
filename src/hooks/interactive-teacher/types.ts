
export interface TeacherMessage {
  id: string;
  content: string;
  isQuestion: boolean;
  awaitingResponse?: boolean;
  timestamp: number;
}

export interface ConversationContext {
  subject: string;
  chapter: string;
  currentTopic: string;
  studentName: string;
  priorKnowledge?: string;
  selectedDifficulty?: string;
  learningMode?: string;
  additionalRequirements?: string;
  lessonProgress: string[];
  studentResponses: {
    question: string;
    answer: string;
    timestamp: number;
  }[];
  conversationHistory: string[];
}
