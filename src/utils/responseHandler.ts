
import { 
  CustomResponseResult,
  ConversationMessage
} from './response/types';
import { getAppSpecificResponse } from './response/appSpecificResponseHandler';
import { isAppSpecificQuery } from './response/appSpecificKeywordDetection';


/**
 * Finds a custom response ONLY for app-specific queries (Ajit Kumar & Study AI related)
 * All other queries will go to Gemini API
 */
export function getCustomResponse(
  userQuery: string, 
  conversationHistory: ConversationMessage[] = []
): CustomResponseResult | null {
  
  if (!userQuery || typeof userQuery !== 'string') {
    return null;
  }

  const cleanedQuery = userQuery.trim().toLowerCase();
  
  if (cleanedQuery.length === 0) {
    return null;
  }

  try {
    console.log(`[RESPONSE HANDLER] Processing query: "${userQuery}"`);

    // 1. Check ONLY for Ajit Kumar and Study AI specific queries
    const appSpecificResponse = getAppSpecificResponse(userQuery);
    if (appSpecificResponse) {
      console.log(`[RESPONSE HANDLER] ✅ Found app-specific response (Ajit/Study AI related)`);
      return appSpecificResponse;
    }

    // 2. For ALL OTHER queries - let Gemini API handle it
    console.log(`[RESPONSE HANDLER] ❌ No custom response found - will use Gemini API for: "${userQuery}"`);
    return null;

  } catch (error) {
    console.error('[RESPONSE HANDLER] ❌ Error in getCustomResponse:', error);
    return null;
  }
}

/**
 * Check if query is specifically about Ajit Kumar or Study AI
 */
export { isAppSpecificQuery };

/**
 * Get a list of available custom response topics
 */
export function getAvailableTopics(): string[] {
  return [
    "Study AI के बारे में",
    "Ajit Kumar (निर्माता) के बारे में", 
    "ऐप के फीचर्स",
    "संपर्क जानकारी"
  ];
}
