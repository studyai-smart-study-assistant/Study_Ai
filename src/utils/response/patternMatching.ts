
import { CustomResponseResult } from './types';
import { getRandomElement } from './utils';

interface Pattern {
  pattern: RegExp;
  responses: string[];
}

const patterns: Pattern[] = [
  { 
    pattern: /study\s*ai/i, 
    responses: [
      "Study AI छात्रों को उनकी पढ़ाई में पूरी तरह से सहायता करने के लिए डिज़ाइन किया गया एक AI-संचालित एप्लिकेशन है। 📚✨",
      "यह एक comprehensive learning companion है जो AI technology का उपयोग करके students की educational journey को enhance करता है। 🚀📝"
    ]
  },
  { 
    pattern: /(अजित|ajit)/i, 
    responses: [
      "अजित कुमार Study AI एप्लिकेशन के निर्माता हैं। वे एक भारतीय लड़का हैं जिन्हें कोडिंग और ऐप डेवलपमेंट में रुचि है। संपर्क: studyai@yahoo.com 📧",
      "अजित कुमार एक passionate भारतीय developer हैं जिन्होंने Study AI बनाया है। Contact: studyai@yahoo.com 📧"
    ]
  },
  { 
    pattern: /(निर्माता|creator|developer|बनाया)/i, 
    responses: [
      "यह Study AI एप्लिकेशन Ajit Kumar द्वारा बनाया गया है। वे एक भारतीय लड़का हैं। 👨‍💻",
      "मेरा निर्माण अजित कुमार ने किया है, जो इस Study AI एप्लिकेशन के निर्माता और डेवलपर हैं। 🚀"
    ]
  }
];

export function checkPatternMatches(cleanedQuery: string): CustomResponseResult | null {
  for (const { pattern, responses } of patterns) {
    if (pattern.test(cleanedQuery)) {
      console.log(`[DEBUG] ✅ Found pattern match for '${cleanedQuery}'`);
      return {
        response: getRandomElement(responses) || responses[0],
        isCustom: true,
        hasFollowUp: false
      };
    }
  }

  return null;
}
