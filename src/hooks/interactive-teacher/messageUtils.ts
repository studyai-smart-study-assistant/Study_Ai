
export const extractFirstSegment = (text: string): { firstSegment: string; hasQuestion: boolean } => {
  if (!text) return { firstSegment: '', hasQuestion: false };

  // Clean the text first
  const cleanedText = text.trim();
  
  // Look for question patterns in Hindi and English
  const questionPatterns = [
    /क्या[\s\S]*?\?/g,
    /कैसे[\s\S]*?\?/g,
    /कौन[\s\S]*?\?/g,
    /कहाँ[\s\S]*?\?/g,
    /कब[\s\S]*?\?/g,
    /क्यों[\s\S]*?\?/g,
    /कितना[\s\S]*?\?/g,
    /what[\s\S]*?\?/gi,
    /how[\s\S]*?\?/gi,
    /when[\s\S]*?\?/gi,
    /where[\s\S]*?\?/gi,
    /why[\s\S]*?\?/gi,
    /do you[\s\S]*?\?/gi,
    /can you[\s\S]*?\?/gi,
    /are you[\s\S]*?\?/gi
  ];

  let questionMatch = null;
  let questionIndex = -1;

  // Find the first question in the text
  for (const pattern of questionPatterns) {
    const matches = cleanedText.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined && (questionIndex === -1 || match.index < questionIndex)) {
        questionIndex = match.index;
        questionMatch = match;
      }
    }
  }

  // If no question found, return the entire text
  if (!questionMatch || questionIndex === -1) {
    return { 
      firstSegment: cleanedText, 
      hasQuestion: false 
    };
  }

  // Extract text up to and including the complete question
  const questionEnd = questionMatch.index! + questionMatch[0].length;
  
  // Find the end of the sentence that contains the question
  // Look for sentence endings after the question
  const afterQuestion = cleanedText.substring(questionEnd);
  const sentenceEndMatch = afterQuestion.match(/^[^.!?\n]*[.!?\n]/);
  
  let finalEnd = questionEnd;
  if (sentenceEndMatch) {
    finalEnd = questionEnd + sentenceEndMatch[0].length;
  }

  const firstSegment = cleanedText.substring(0, finalEnd).trim();

  return {
    firstSegment,
    hasQuestion: true
  };
};
