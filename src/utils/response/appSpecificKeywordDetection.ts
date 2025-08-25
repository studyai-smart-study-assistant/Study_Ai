
import { detectLanguage } from './languageDetection';

export interface AppSpecificKeywordMatch {
  type: 'creator' | 'about_app' | 'features' | 'technology' | 'ajit_info' | 'app_name';
  keywords: string[];
  language: 'hindi' | 'english';
}

// Very specific keywords ONLY for Ajit Kumar and Study AI related queries
const APP_SPECIFIC_KEYWORDS = {
  creator: {
    hindi: [
      'तुम्हें किसने बनाया', 'किसने विकसित किया', 'निर्माता कौन', 'बनाने वाला कौन',
      'तुम किसके प्रोडक्ट', 'डेवलपर कौन', 'study ai किसने बनाया', 'स्टडी एआई का निर्माता',
      'इस ऐप को किसने', 'आपका निर्माता', 'आपके पीछे कौन', 'यह ऐप किसका',
      'अजित कुमार ने बनाया', 'ajit kumar creator', 'ajit developer'
    ],
    english: [
      'who made you', 'who developed', 'who is your creator', 'who created you',
      'who built you', 'who is the developer', 'who developed study ai', 'whose product are you',
      'who is behind you', 'who made this app', 'creator of study ai', 'ajit kumar made',
      'ajit created', 'ajit developer'
    ]
  },
  about_app: {
    hindi: [
      'तुम कौन हो', 'study ai क्या है', 'स्टडी एआई क्या है', 'परिचय दो', 
      'अपने बारे में बताओ', 'आप क्या हो', 'यह ऐप किस बारे में', 'मुझे अपने बारे में बताओ',
      'study ai के बारे में', 'स्टडी एआई के बारे में'
    ],
    english: [
      'what are you', 'what is study ai', 'introduce yourself', 'tell me about yourself',
      'what is this app about', 'can you introduce yourself', 'about study ai',
      'study ai information', 'about this application'
    ]
  },
  features: {
    hindi: [
      'study ai क्या-क्या कर सकता', 'study ai की विशेषताएँ', 'study ai के फीचर्स', 
      'study ai की कार्यक्षमता', 'स्टडी एआई की विशेषताएं', 'study ai कैसे मदद करता',
      'यह ऐप क्या फीचर्स देता', 'study ai के functions'
    ],
    english: [
      'what can study ai do', 'study ai features', 'functionalities of study ai',
      'study ai capabilities', 'features of study ai', 'what study ai offers',
      'study ai functions', 'study ai help'
    ]
  },
  technology: {
    hindi: [
      'study ai कैसे काम करता', 'study ai की तकनीक', 'study ai किस तकनीक पर',
      'study ai के पीछे कौन सी तकनीक', 'study ai का technology'
    ],
    english: [
      'how does study ai work', 'study ai technology', 'technology behind study ai',
      'how is study ai powered', 'study ai tech stack', 'study ai working'
    ]
  },
  ajit_info: {
    hindi: [
      'अजित कौन है', 'अजित क्या करते', 'अजित कुमार कौन', 'अजित के बारे में बताओ',
      'अजित कुमार के बारे में', 'ajit kumar कौन है', 'ajit कौन है',
      'अजित कुमार क्या करते', 'अजित का परिचय'
    ],
    english: [
      'who is ajit', 'tell me about ajit', 'what does ajit do', 'about ajit kumar',
      'who is ajit kumar', 'ajit kumar information', 'ajit kumar details'
    ]
  },
  app_name: {
    hindi: [
      'तुम्हारा नाम क्या', 'ऐप का नाम क्या', 'आपका नाम क्या', 'इस ऐप का नाम',
      'study ai नाम', 'स्टडी एआई नाम'
    ],
    english: [
      'what is your name', 'name of this app', 'what is the name of this app', 'your name',
      'study ai name', 'app name'
    ]
  }
};

export function detectAppSpecificKeywords(query: string): AppSpecificKeywordMatch | null {
  const cleanedQuery = query.toLowerCase().trim();
  const detectedLanguage = detectLanguage(query);
  
  console.log(`[APP SPECIFIC DETECTION] Query: "${query}"`);
  console.log(`[APP SPECIFIC DETECTION] Cleaned: "${cleanedQuery}"`);
  console.log(`[APP SPECIFIC DETECTION] Detected language: ${detectedLanguage}`);
  
  // Check each category with language-specific keywords
  for (const [type, languageKeywords] of Object.entries(APP_SPECIFIC_KEYWORDS)) {
    const keywords = languageKeywords[detectedLanguage] || [];
    
    for (const keyword of keywords) {
      if (cleanedQuery.includes(keyword.toLowerCase())) {
        console.log(`[APP SPECIFIC DETECTION] ✅ Match found: ${type} (${detectedLanguage}) for "${keyword}"`);
        return {
          type: type as AppSpecificKeywordMatch['type'],
          keywords: keywords,
          language: detectedLanguage
        };
      }
    }
  }
  
  // Also check the opposite language for mixed queries
  const oppositeLanguage = detectedLanguage === 'hindi' ? 'english' : 'hindi';
  for (const [type, languageKeywords] of Object.entries(APP_SPECIFIC_KEYWORDS)) {
    const keywords = languageKeywords[oppositeLanguage] || [];
    
    for (const keyword of keywords) {
      if (cleanedQuery.includes(keyword.toLowerCase())) {
        console.log(`[APP SPECIFIC DETECTION] ✅ Cross-language match: ${type} (${oppositeLanguage}) for "${keyword}"`);
        return {
          type: type as AppSpecificKeywordMatch['type'],
          keywords: keywords,
          language: oppositeLanguage
        };
      }
    }
  }
  
  console.log(`[APP SPECIFIC DETECTION] ❌ No matches found for "${cleanedQuery}" - will use Gemini API`);
  return null;
}

export function isAppSpecificQuery(query: string): boolean {
  const result = detectAppSpecificKeywords(query) !== null;
  console.log(`[APP SPECIFIC DETECTION] isAppSpecificQuery("${query}") = ${result}`);
  return result;
}
