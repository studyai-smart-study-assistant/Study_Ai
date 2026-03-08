
import { Question } from './types';

export const parseQuestionsFromResponse = (response: string): Question[] => {
  const questions: Question[] = [];
  
  // Clean markdown formatting
  const cleanText = response
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/```[^`]*```/g, '');
  
  const lines = cleanText.split('\n').filter(line => line.trim());
  
  let currentQuestion: Partial<Question> = {};
  let questionId = 1;
  let collectingExplanation = false;
  let explanationLines: string[] = [];

  const pushCurrentQuestion = () => {
    if (currentQuestion.question && currentQuestion.options && currentQuestion.options.length >= 2) {
      questions.push({
        id: questionId++,
        question: currentQuestion.question,
        options: currentQuestion.options,
        correctAnswer: currentQuestion.correctAnswer ?? 0,
        explanation: explanationLines.length > 0 ? explanationLines.join(' ').trim() : currentQuestion.explanation
      });
    }
    currentQuestion = {};
    collectingExplanation = false;
    explanationLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Question pattern: starts with number followed by . or ) or :
    const questionMatch = line.match(/^(\d+)\s*[.):]\s*(.+)/);
    if (questionMatch && !(/^[A-Da-d]\s*[.)]\s/.test(line))) {
      // Check if this looks like a new question (not an option)
      const potentialQuestion = questionMatch[2].trim();
      if (potentialQuestion.length > 5) {
        pushCurrentQuestion();
        currentQuestion = {
          question: potentialQuestion,
          options: []
        };
        collectingExplanation = false;
        continue;
      }
    }
    
    // Options pattern: A. B. C. D. or A) B) C) D) or (A) (B) etc.
    const optionMatch = line.match(/^[\(\s]*([A-Da-d])\s*[.):\]]\s*(.+)/);
    if (optionMatch && currentQuestion.question) {
      collectingExplanation = false;
      if (!currentQuestion.options) currentQuestion.options = [];
      currentQuestion.options.push(optionMatch[2].trim());
      continue;
    }
    
    // Correct answer pattern - multiple formats
    const answerMatch = line.match(/(?:correct\s*answer|सही\s*उत्तर|answer|उत्तर|सही\s*विकल्प|correct|ans)\s*[:\-=]\s*[\(\s]*([A-Da-d])/i);
    if (answerMatch && currentQuestion.question) {
      currentQuestion.correctAnswer = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
      collectingExplanation = false;
      continue;
    }
    
    // Also check for standalone answer like "Answer: A" or just "A" after options
    if (currentQuestion.options && currentQuestion.options.length === 4 && !currentQuestion.correctAnswer && currentQuestion.correctAnswer !== 0) {
      const standaloneAnswer = line.match(/^([A-Da-d])$/);
      if (standaloneAnswer) {
        currentQuestion.correctAnswer = standaloneAnswer[1].toUpperCase().charCodeAt(0) - 65;
        continue;
      }
    }
    
    // Explanation pattern
    const explanationMatch = line.match(/(?:explanation|व्याख्या|because|क्योंकि|reason|कारण|स्पष्टीकरण)\s*[:\-]\s*(.*)/i);
    if (explanationMatch && currentQuestion.question) {
      collectingExplanation = true;
      if (explanationMatch[1].trim()) {
        explanationLines.push(explanationMatch[1].trim());
      }
      continue;
    }
    
    // Continue collecting explanation text
    if (collectingExplanation && line && !(/^\d+\s*[.):]\s/.test(line))) {
      explanationLines.push(line);
    }
  }
  
  // Add last question
  pushCurrentQuestion();
  
  return questions;
};
