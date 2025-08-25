
import { ConversationMessage, CustomResponseResult } from './types';
import { getRandomElement } from './utils';

/**
 * Enhanced context-aware response handler for conversational flow
 */
export function getContextualResponse(
  userQuery: string, 
  conversationHistory: ConversationMessage[]
): CustomResponseResult | null {
  
  if (conversationHistory.length === 0) return null;
  
  const cleanQuery = userQuery.trim().toLowerCase();
  const lastAiMessage = conversationHistory[conversationHistory.length - 1];
  
  // Enhanced context analysis - look at multiple previous messages
  const recentMessages = conversationHistory.slice(-6); // Look at last 6 messages
  const recentTopics = extractTopicsFromHistory(recentMessages);
  
  console.log('[CONTEXTUAL RESPONSES] Recent topics detected:', recentTopics);
  console.log('[CONTEXTUAL RESPONSES] Query:', cleanQuery);
  
  // Handle "हाँ" responses to follow-up questions
  if ((cleanQuery.includes('हाँ') || cleanQuery.includes('yes') || cleanQuery.includes('यस')) && 
      lastAiMessage && lastAiMessage.sender === 'ai') {
    
    // About Ajit Kumar follow-up
    if (lastAiMessage.text.includes('अजित कुमार के बारे में कुछ और जानना चाहेंगे')) {
      const ajitDetailResponses = [
        "अजित कुमार एक भारतीय लड़का है जिसने कम उम्र में ही छात्रों की मदद करने के लिए Study AI जैसा innovative application बनाया है। उनका passion है education को technology के साथ accessible बनाना। 🚀✨",
        "अजित कुमार Study AI के निर्माता हैं। वे एक young और talented developer हैं जो छात्रों की academic journey को easier बनाने के लिए committed हैं। उनकी coding skills और educational vision का perfect combination है! 💻📚",
        "अजित कुमार का vision है कि हर student को quality education मिले। उन्होंने अपनी programming skills का उपयोग करके Study AI बनाया ताकि learning more interactive और effective हो सके। 🎯🌟",
        "वैसे, अजित कुमार बहुत ही dedicated हैं अपने काम के प्रति। उन्होंने Study AI को सिर्फ एक app नहीं बनाया बल्कि students के लिए एक complete learning companion बनाया है। 🤝📖"
      ];
      return {
        response: getRandomElement(ajitDetailResponses) || ajitDetailResponses[0],
        isCustom: true,
        hasFollowUp: true
      };
    }
    
    // Study AI features follow-up with enhanced responses
    if (lastAiMessage.text.includes('Study AI की किसी खास feature')) {
      const featureResponses = [
        "Study AI में कई amazing features हैं! 🎯 AI Quiz Generator से custom quizzes बना सकते हैं, 📚 Notes Generator से detailed study material मिलता है, 👨‍🏫 Teacher Mode में personal tutor experience होता है, और 📊 Live Tests से real exam practice मिलती है!",
        "मेरी top features हैं: Smart Notes Creation 📝, Interactive Quiz System 🧠, AI Teacher Mode 🎓, Live Testing Environment ⏰, Progress Tracking 📈, और Gamification System 🏆 जो learning को fun बनाता है!",
        "Study AI एक complete learning ecosystem है! यहाँ AI-powered content generation, personalized learning paths, real-time assessments, comprehensive analytics, और motivational elements सब कुछ है। 🚀✨",
        "हाल ही में हमने context-aware conversations भी add किए हैं! अब मैं आपकी पिछली बातचीत को याद रख सकता हूँ और उसी के हिसाब से बेहतर जवाब दे सकता हूँ। 🧠💭"
      ];
      return {
        response: getRandomElement(featureResponses) || featureResponses[0],
        isCustom: true,
        hasFollowUp: true
      };
    }
  }
  
  // Handle "नहीं" responses
  if ((cleanQuery.includes('नहीं') || cleanQuery.includes('no') || cleanQuery.includes('नो')) && 
      lastAiMessage && lastAiMessage.sender === 'ai' && lastAiMessage.text.includes('चाहेंगे')) {
    
    const politeDeclineResponses = [
      "कोई बात नहीं! 😊 अगर कभी कोई और सवाल हो तो बेझिझक पूछें। मैं हमेशा यहाँ आपकी मदद के लिए हूँ। 🤗",
      "बिल्कुल ठीक है! 👍 जब भी कुछ जानना चाहें तो मैं ready हूँ। Happy learning! 📚✨",
      "No problem! 😄 आपकी जरूरत के हिसाब से ही बात करते हैं। कुछ और help चाहिए तो बता देना! 🚀",
      "समझ गया! अपनी pace से चलिए। मैं यहाँ ही हूँ जब भी जरूरत हो। 😌✨"
    ];
    return {
      response: getRandomElement(politeDeclineResponses) || politeDeclineResponses[0],
      isCustom: true,
      hasFollowUp: false
    };
  }

  // Enhanced topic continuity - if user asks about something they discussed before
  if (recentTopics.length > 0) {
    const topicContinuityResponse = getTopicContinuityResponse(cleanQuery, recentTopics);
    if (topicContinuityResponse) {
      return topicContinuityResponse;
    }
  }

  // Check for conversation patterns (repeated questions, clarifications, etc.)
  const patternResponse = getConversationPatternResponse(cleanQuery, conversationHistory);
  if (patternResponse) {
    return patternResponse;
  }
  
  return null;
}

/**
 * Extract topics from conversation history
 */
function extractTopicsFromHistory(messages: ConversationMessage[]): string[] {
  const topics: string[] = [];
  
  messages.forEach(message => {
    const text = message.text.toLowerCase();
    
    // Educational topics
    if (text.includes('गणित') || text.includes('math')) topics.push('गणित');
    if (text.includes('विज्ञान') || text.includes('science')) topics.push('विज्ञान');
    if (text.includes('इतिहास') || text.includes('history')) topics.push('इतिहास');
    if (text.includes('अंग्रेजी') || text.includes('english')) topics.push('अंग्रेजी');
    if (text.includes('भौतिकी') || text.includes('physics')) topics.push('भौतिकी');
    if (text.includes('रसायन') || text.includes('chemistry')) topics.push('रसायन');
    
    // App-specific topics
    if (text.includes('study ai') || text.includes('ऐप')) topics.push('Study AI');
    if (text.includes('अज़ित कुमार') || text.includes('ajit')) topics.push('निर्माता');
    if (text.includes('quiz') || text.includes('प्रश्न')) topics.push('Quiz');
    if (text.includes('notes') || text.includes('नोट्स')) topics.push('Notes');
    if (text.includes('teacher') || text.includes('शिक्षक')) topics.push('Teacher Mode');
  });
  
  return [...new Set(topics)]; // Remove duplicates
}

/**
 * Generate responses based on topic continuity
 */
function getTopicContinuityResponse(query: string, recentTopics: string[]): CustomResponseResult | null {
  // If user asks about a topic they mentioned before
  for (const topic of recentTopics) {
    if (query.includes(topic.toLowerCase()) || 
        (topic === 'गणित' && query.includes('math')) ||
        (topic === 'Study AI' && (query.includes('study') || query.includes('ऐप')))) {
      
      const continuityResponses = [
        `मैं देख रहा हूँ कि आप ${topic} के बारे में फिर से पूछ रहे हैं! 😊 क्या आपको कोई specific help चाहिए इस विषय में?`,
        `अच्छा! ${topic} पर वापस आ गए हैं। 📚 इस बार क्या जानना चाहते हैं?`,
        `${topic} में आपकी interest दिख रही है! 🎯 मैं इसमें आपकी और भी मदद कर सकता हूँ।`
      ];
      
      return {
        response: getRandomElement(continuityResponses) || continuityResponses[0],
        isCustom: true,
        hasFollowUp: true
      };
    }
  }
  
  return null;
}

/**
 * Detect conversation patterns and respond accordingly
 */
function getConversationPatternResponse(query: string, history: ConversationMessage[]): CustomResponseResult | null {
  const recentUserMessages = history.filter(msg => msg.sender === 'user').slice(-3);
  
  // Check for repeated similar questions
  if (recentUserMessages.length >= 2) {
    const lastTwoQueries = recentUserMessages.slice(-2).map(msg => msg.text.toLowerCase());
    const similarity = calculateTextSimilarity(lastTwoQueries[0], lastTwoQueries[1]);
    
    if (similarity > 0.7) { // 70% similarity
      const clarificationResponses = [
        "लगता है आप same topic के बारे में फिर से पूछ रहे हैं। 🤔 क्या मेरा पिछला जवाब clear नहीं था? मैं अलग तरीके से explain कर सकता हूँ!",
        "मैं समझ गया कि आप इस विषय को और अच्छे से समझना चाहते हैं! 😊 आइए इसे step-by-step देखते हैं।",
        "अच्छा सवाल! अगर पिछला जवाब confusing था तो मैं इसे और simple way में बताता हूँ। 📚✨"
      ];
      
      return {
        response: getRandomElement(clarificationResponses) || clarificationResponses[0],
        isCustom: true,
        hasFollowUp: false
      };
    }
  }
  
  return null;
}

/**
 * Simple text similarity calculation
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.split(' ');
  const words2 = text2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}
