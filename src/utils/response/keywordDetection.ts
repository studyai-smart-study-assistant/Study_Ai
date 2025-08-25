
import { KeywordMatch } from './types';

/**
 * Enhanced keyword detection function that covers all possible variations
 */
export function detectAppSpecificKeywords(query: string): KeywordMatch | null {
  const cleanQuery = query.trim().toLowerCase();
  
  // Study AI related keywords (in multiple languages and formats)
  const studyAiKeywords = [
    'study ai', 'studyai', 'स्टडी एआई', 'study a.i', 'study a i',
    'स्टडी ai', 'study ऐआई', 'एप्लिकेशन', 'app', 'application', 'ऐप'
  ];
  
  // Ajit Kumar related keywords (in multiple languages and formats)
  const ajitKeywords = [
    'ajit', 'अजित', 'ajit kumar', 'अजित कुमार', 'ajeet', 'अजीत',
    'creator', 'निर्माता', 'developer', 'डेवलपर', 'maker', 'बनाने वाला',
    'बनाया', 'किसने बनाया', 'कौन बनाया', 'who created', 'who made'
  ];
  
  // Identity/Introduction keywords
  const identityKeywords = [
    'तुम कौन', 'आप कौन', 'who are you', 'tum kaun', 'aap kaun',
    'you are', 'what are you', 'introduce', 'परिचय', 'intro',
    'tell me about yourself', 'अपना परिचय', 'तुम्हारा नाम'
  ];
  
  // Check for Study AI keywords
  for (const keyword of studyAiKeywords) {
    if (cleanQuery.includes(keyword)) {
      return { type: 'study_ai', keywords: studyAiKeywords };
    }
  }
  
  // Check for Ajit Kumar keywords
  for (const keyword of ajitKeywords) {
    if (cleanQuery.includes(keyword)) {
      return { type: 'ajit_kumar', keywords: ajitKeywords };
    }
  }
  
  // Check for identity keywords
  for (const keyword of identityKeywords) {
    if (cleanQuery.includes(keyword)) {
      return { type: 'identity', keywords: identityKeywords };
    }
  }
  
  return null;
}

/**
 * Checks if a query is likely to be application-specific
 */
export function isAppSpecificQuery(userQuery: string): boolean {
  const cleanedQuery = userQuery.trim().toLowerCase();
  
  const appSpecificKeywords = [
    // Application related
    'study ai', 'studyai', 'स्टडी एआई', 'एप्लिकेशन', 'app', 'application',
    
    // Creator related
    'ajit kumar', 'अजित कुमार', 'ajit', 'अजित', 'निर्माता', 'creator', 'developer', 'बनाया',
    'किसने बनाया', 'कौन बनाया', 'डेवलपर', 'who created', 'who made', 'who developed',
    
    // Identity related
    'आप कौन', 'तुम कौन', 'who are you', 'you are', 'what are you', 'introduce yourself',
    'your intro', 'अपना परिचय', 'tell me about yourself', 'who r u', 'tum kaun', 'aap kaun',
    
    // Contact related
    'संपर्क', 'contact', 'email', 'ईमेल', 'contact info', 'संपर्क जानकारी',
    'कैसे मिलें', 'how to contact', 'contact details',
    
    // Conversational
    'हैलो', 'नमस्ते', 'hi', 'hello', 'धन्यवाद', 'thank you', 'thanks'
  ];
  
  return appSpecificKeywords.some(keyword => cleanedQuery.includes(keyword)) || 
         detectAppSpecificKeywords(cleanedQuery) !== null;
}
