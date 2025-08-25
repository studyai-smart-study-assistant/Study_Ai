
import Fuse from 'fuse.js';
import { ProcessedResponse, CustomResponseResult } from './types';
import { getRandomElement } from './utils';

// Configure Fuse.js options for fuzzy search
const fuseOptions = {
  keys: ['question'],
  threshold: 0.35,
  ignoreLocation: true,
  distance: 100,
  includeScore: true
};

export function createFuseInstance(customKnowledgeBase: ProcessedResponse[]) {
  return new Fuse(customKnowledgeBase, fuseOptions);
}

export function performFuzzySearch(
  fuse: Fuse<ProcessedResponse>, 
  cleanedQuery: string
): CustomResponseResult | null {
  const results = fuse.search(cleanedQuery);

  if (results.length > 0) {
    const bestMatch = results[0];
    if (bestMatch.score !== undefined && bestMatch.score < 0.5) {
      console.log(`[DEBUG] ✅ Found fuzzy custom response for '${cleanedQuery}' with score: ${bestMatch.score}`);
      
      const chosenAnswer = getRandomElement(bestMatch.item.answers);
      const chosenFollowUp = getRandomElement(bestMatch.item.follow_up_questions);
      
      let finalResponse = chosenAnswer || bestMatch.item.answers[0];
      if (chosenFollowUp) {
        finalResponse += `\n\n${chosenFollowUp}`;
      }
      
      return {
        response: finalResponse,
        isCustom: true,
        hasFollowUp: !!chosenFollowUp
      };
    } else {
      console.log(`[DEBUG] ⚠️ Fuzzy match score too low: ${bestMatch.score} for '${cleanedQuery}'`);
    }
  }

  return null;
}
