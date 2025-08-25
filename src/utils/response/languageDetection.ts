
/**
 * Language detection utility for determining if query is in Hindi or English
 */

const HINDI_INDICATORS = [
  // Common Hindi words
  'है', 'हैं', 'का', 'की', 'के', 'में', 'से', 'को', 'और', 'या', 'तुम', 'आप',
  'मैं', 'हम', 'वे', 'यह', 'वह', 'कि', 'जो', 'कैसे', 'क्या', 'कौन', 'कब', 'कहाँ',
  'तुम्हें', 'आपको', 'मुझे', 'हमें', 'उन्हें', 'इसे', 'उसे', 'करना', 'होना', 'जाना',
  'अजित', 'कुमार', 'स्टडी', 'एआई', 'बनाया', 'निर्माता', 'डेवलपर', 'ऐप', 'एप्लिकेशन',
  'पढ़ाई', 'छात्र', 'विशेषताएं', 'सुविधाएं', 'तकनीक', 'कार्यक्षमता', 'परिचय', 'नाम'
];

const ENGLISH_INDICATORS = [
  // Common English words
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'you', 'i', 'me', 'we', 'they', 'he', 'she', 'it', 'what', 'who', 'how',
  'when', 'where', 'why', 'which', 'your', 'my', 'our', 'their', 'his', 'her', 'its',
  'study', 'ai', 'app', 'application', 'creator', 'developer', 'made',
  'created', 'features', 'help', 'about', 'name', 'technology', 'work', 'do'
];

export function detectLanguage(text: string): 'hindi' | 'english' {
  const cleanText = text.toLowerCase().trim();
  let hindiScore = 0;
  let englishScore = 0;

  // Check for Devanagari script first (highest priority)
  const devanagariPattern = /[\u0900-\u097F]/;
  if (devanagariPattern.test(cleanText)) {
    hindiScore += 10; // Much higher weight for Hindi script
  }

  // Count Hindi indicators
  HINDI_INDICATORS.forEach(indicator => {
    if (cleanText.includes(indicator)) {
      hindiScore += 2; // Increased weight for Hindi words
    }
  });

  // Count English indicators
  ENGLISH_INDICATORS.forEach(indicator => {
    if (cleanText.includes(indicator)) {
      englishScore += 1; // Lower weight for English words
    }
  });

  // Special handling for mixed queries like "Ajit Kumar कौन है"
  if (cleanText.includes('अजित') || cleanText.includes('कुमार') || cleanText.includes('कौन')) {
    hindiScore += 5;
  }

  console.log(`[LANGUAGE DETECTION] Text: "${cleanText}"`);
  console.log(`[LANGUAGE DETECTION] Hindi score: ${hindiScore}, English score: ${englishScore}`);
  
  const detectedLanguage = hindiScore > englishScore ? 'hindi' : 'english';
  console.log(`[LANGUAGE DETECTION] Final detection: ${detectedLanguage}`);
  
  return detectedLanguage;
}

/**
 * Check if the query contains mixed language content
 */
export function isMixedLanguage(text: string): boolean {
  const cleanText = text.toLowerCase().trim();
  
  const hasHindi = HINDI_INDICATORS.some(indicator => cleanText.includes(indicator)) ||
                   /[\u0900-\u097F]/.test(cleanText);
  
  const hasEnglish = ENGLISH_INDICATORS.some(indicator => cleanText.includes(indicator)) ||
                     /[a-zA-Z]/.test(cleanText);
  
  return hasHindi && hasEnglish;
}
