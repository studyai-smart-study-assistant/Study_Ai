
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizConfig {
  topic: string;
  subject: string;
  language: string;
  questionCount: number;
  timeLimit: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  wrongAnswers: { question: string; userAnswer: string; correctAnswer: string }[];
  xpEarned?: number;
  questionTimes?: number[]; // Time spent on each question in seconds
}

export interface SubjectOption {
  value: string;
  label: string;
}

export interface ReviewAnswer {
  questionIndex: number;
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  explanation?: string;
  isCorrect: boolean;
  timeSpent?: number; // Time spent on this question in seconds
}
