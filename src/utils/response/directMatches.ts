
import { DirectMatch, CustomResponseResult } from './types';
import { getRandomElement } from './utils';

export const directMatches: DirectMatch[] = [
  {
    keywords: ["हैलो", "नमस्ते", "hi", "hello", "hey", "हाय", "namaste", "good morning", "good evening", "good afternoon"],
    responses: [
      "नमस्ते! 🙏 मैं Study AI हूँ, आपका पढ़ाई का साथी। मैं आपकी पढ़ाई में कैसे मदद कर सकता हूँ? 📚😊",
      "हैलो! 👋 Welcome to Study AI! मैं आपका personal study assistant हूँ। आज क्या पढ़ना है? 📖✨",
      "नमस्कार! 🙏 Study AI में आपका स्वागत है। मैं हमेशा आपकी academic help के लिए ready हूँ! 🤖📚",
      "हाय! 😊 मैं आपका study buddy हूँ। Learning journey को exciting बनाने के लिए यहाँ हूँ! 🚀📝"
    ],
    followUps: [
      "आज आपकी पढ़ाई के लिए क्या plan है?",
      "क्या आप नोट्स बनाना चाहते हैं या quiz solve करना?",
      "मैं आपकी किस subject में मदद कर सकता हूँ?"
    ]
  },
  {
    keywords: ["धन्यवाद", "शुक्रिया", "thank you", "thanks", "थैंक्स", "thanku", "thx"],
    responses: [
      "आपका स्वागत है! 😊 मुझे आपकी मदद करके खुशी हुई। कोई और सवाल हो तो बेझिझक पूछें! 🤗",
      "खुशी हुई आपकी help कर सके! 😄 Study AI हमेशा आपके साथ है। Happy learning! 📚✨",
      "बिल्कुल welcome! 🙏 आपकी success ही मेरी success है। कभी भी doubt हो तो पूछ लेना! 💪📖",
      "Pleasure था आपकी assistance करना! 😊 Keep studying, keep growing! मैं हमेशा यहाँ हूँ! 🌟📚"
    ],
    followUps: [
      "क्या कोई और topic में मदद चाहिए?",
      "आज के लिए कोई study goal set करना चाहते हैं?",
      "मैं आपके लिए कोई quiz बना सकता हूँ, interested हैं?"
    ]
  }
];

export function checkDirectMatches(cleanedQuery: string): CustomResponseResult | null {
  for (const match of directMatches) {
    if (match.keywords.some(keyword => cleanedQuery.includes(keyword))) {
      console.log(`[DEBUG] ✅ Found direct keyword match for '${cleanedQuery}'`);
      const chosenResponse = getRandomElement(match.responses);
      const chosenFollowUp = getRandomElement(match.followUps || []);
      
      let finalResponse = chosenResponse || match.responses[0];
      if (chosenFollowUp) {
        finalResponse += `\n\n${chosenFollowUp}`;
      }
      
      return {
        response: finalResponse,
        isCustom: true,
        hasFollowUp: !!chosenFollowUp
      };
    }
  }
  
  return null;
}
