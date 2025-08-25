
export interface CustomResponse {
  question: string;
  answers: string[];
  follow_up_questions?: string[];
}

export interface ProcessedResponse {
  question: string;
  answers: string[];
  follow_up_questions: string[];
}

export interface ConversationMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: number;
}

export interface CustomResponseResult {
  response: string;
  isCustom: boolean;
  hasFollowUp: boolean;
}

export interface KeywordMatch {
  type: string;
  keywords: string[];
}

export interface DirectMatch {
  keywords: string[];
  responses: string[];
  followUps?: string[];
}
