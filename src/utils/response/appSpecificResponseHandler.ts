
import appSpecificData from '@/data/app_specific_responses.json';
import { getRandomElement } from './utils';
import { CustomResponseResult } from './types';
import { detectAppSpecificKeywords } from './appSpecificKeywordDetection';

interface AppSpecificResponse {
  type: string;
  hindi_responses: string[];
  english_responses: string[];
}

const appSpecificResponses: AppSpecificResponse[] = appSpecificData;

export function getAppSpecificResponse(userQuery: string): CustomResponseResult | null {
  if (!userQuery || typeof userQuery !== 'string') {
    console.log(`[APP SPECIFIC HANDLER] ❌ Invalid query: ${userQuery}`);
    return null;
  }

  const cleanedQuery = userQuery.trim().toLowerCase();
  
  if (cleanedQuery.length === 0) {
    console.log(`[APP SPECIFIC HANDLER] ❌ Empty query`);
    return null;
  }

  try {
    console.log(`[APP SPECIFIC HANDLER] 🔍 Processing query: "${userQuery}"`);

    // First check if it's an app-specific query
    const keywordMatch = detectAppSpecificKeywords(cleanedQuery);
    
    if (!keywordMatch) {
      console.log(`[APP SPECIFIC HANDLER] ❌ Not an app-specific query`);
      return null;
    }

    console.log(`[APP SPECIFIC HANDLER] ✅ App-specific query detected: ${keywordMatch.type} (${keywordMatch.language})`);

    // Find matching response based on type
    const responseItem = appSpecificResponses.find(item => item.type === keywordMatch.type);
    
    if (!responseItem) {
      console.log(`[APP SPECIFIC HANDLER] ❌ No response found for type: ${keywordMatch.type}`);
      return null;
    }

    console.log(`[APP SPECIFIC HANDLER] ✅ Response item found for type: ${keywordMatch.type}`);

    // Get responses based on detected language
    const responses = keywordMatch.language === 'hindi' 
      ? responseItem.hindi_responses 
      : responseItem.english_responses;

    if (!responses || responses.length === 0) {
      console.log(`[APP SPECIFIC HANDLER] ❌ No responses available for language: ${keywordMatch.language}`);
      return null;
    }

    console.log(`[APP SPECIFIC HANDLER] ✅ Found ${responses.length} responses for ${keywordMatch.language}`);

    // Select a random response
    const randomResponse = getRandomElement(responses);
    
    if (!randomResponse) {
      console.log(`[APP SPECIFIC HANDLER] ❌ Failed to select random response`);
      return {
        response: responses[0], // Fallback to first response
        isCustom: true,
        hasFollowUp: false
      };
    }

    console.log(`[APP SPECIFIC HANDLER] ✅ Selected random response for ${keywordMatch.type} (${keywordMatch.language})`);
    console.log(`[APP SPECIFIC HANDLER] 📝 Response: ${randomResponse.substring(0, 100)}...`);
    
    return {
      response: randomResponse,
      isCustom: true,
      hasFollowUp: false
    };

  } catch (error) {
    console.error('[APP SPECIFIC HANDLER] ❌ Error in getAppSpecificResponse:', error);
    return null;
  }
}
