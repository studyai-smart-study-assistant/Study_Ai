
import { Question } from './types';

export const parseQuestionsFromResponse = (response: string): Question[] => {
  const questions: Question[] = [];
  const lines = response.split('\n').filter(line => line.trim());
  
  let currentQuestion: Partial<Question> = {};
  let questionId = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Question pattern (starting with number)
    if (/^\d+[.)]\s/.test(line)) {
      if (currentQuestion.question && currentQuestion.options) {
        questions.push({
          id: questionId++,
          question: currentQuestion.question,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.correctAnswer || 0,
          explanation: currentQuestion.explanation
        });
      }
      currentQuestion = {
        question: line.replace(/^\d+[.)]\s/, ''),
        options: []
      };
    }
    // Options pattern (A, B, C, D)
    else if (/^[A-D][.)]\s/.test(line)) {
      if (!currentQuestion.options) currentQuestion.options = [];
      currentQuestion.options.push(line.replace(/^[A-D][.)]\s/, ''));
    }
    // Correct answer pattern
    else if (/correct answer|सही उत्तर|answer|उत्तर/i.test(line)) {
      const match = line.match(/[A-D]/i);
      if (match) {
        currentQuestion.correctAnswer = match[0].toUpperCase().charCodeAt(0) - 65;
      }
    }
    // Explanation pattern
    else if (/explanation|व्याख्या|because|क्योंकि/i.test(line)) {
      currentQuestion.explanation = line;
    }
  }
  
  // Add last question
  if (currentQuestion.question && currentQuestion.options) {
    questions.push({
      id: questionId,
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer || 0,
      explanation: currentQuestion.explanation
    });
  }
  
  return questions;
};
