import { BadgeInfo } from './types';

// Generate badges based on user data
export const generateBadges = (userData: any): string[] => {
  const badges: string[] = [];
  
  // Points based badges
  if ((userData.points || 0) >= 10000) badges.push('study-marathon');
  if ((userData.points || 0) >= 5000) badges.push('dedicated-student');
  
  // Level based badges
  if ((userData.level || 0) >= 15) badges.push('math-wizard');
  if ((userData.level || 0) >= 10) badges.push('science-master');
  if ((userData.level || 0) >= 5) badges.push('quick-learner');
  
  // Other badges based on user data
  if (userData.studySessions && userData.studySessions > 50) badges.push('consistent-learner');
  if (userData.quizScores && userData.quizScores.length > 20) badges.push('quiz-champion');
  
  // If no badges yet, give at least one
  if (badges.length === 0) badges.push('rising-star');
  
  return badges;
};

// Get badge information by ID
export const getBadgeInfo = (badgeId: string): BadgeInfo => {
  const badges: Record<string, BadgeInfo> = {
    'math-wizard': { 
      name: 'गणित विज़ार्ड', 
      description: '100 से अधिक गणित प्रश्न हल किए', 
      color: 'blue' 
    },
    'science-master': { 
      name: 'विज्ञान मास्टर', 
      description: 'विज्ञान में उत्कृष्ट प्रदर्शन', 
      color: 'green' 
    },
    'study-marathon': { 
      name: 'अध्ययन मैराथन', 
      description: 'एक दिन में 8 घंटे से अधिक अध्ययन किया', 
      color: 'purple' 
    },
    'literature-buff': { 
      name: 'साहित्य प्रेमी', 
      description: '50 से अधिक साहित्य क्विज पूरे किए', 
      color: 'amber' 
    },
    'history-expert': { 
      name: 'इतिहास विशेषज्ञ', 
      description: 'इतिहास विषय में विशेष ज्ञान', 
      color: 'brown' 
    },
    'consistent-learner': { 
      name: 'नियमित अध्येता', 
      description: '30 दिन की अध्ययन स्ट्रीक', 
      color: 'teal' 
    },
    'physics-genius': { 
      name: 'भौतिकी प्रतिभा', 
      description: 'भौतिकी में उत्कृष्ट प्रदर्शन', 
      color: 'indigo' 
    },
    'quiz-champion': { 
      name: 'क्विज चैम्पियन', 
      description: '25 क्विज में 90% से अधिक स्कोर', 
      color: 'orange' 
    },
    'chemistry-master': { 
      name: 'रसायन मास्टर', 
      description: 'रसायन विज्ञान में विशेषज्ञता', 
      color: 'rose' 
    },
    'early-bird': { 
      name: 'अर्ली बर्ड', 
      description: '20 बार सुबह 6 बजे से पहले अध्ययन शुरू किया', 
      color: 'yellow' 
    },
    'biology-expert': { 
      name: 'जीव विज्ञान विशेषज्ञ', 
      description: 'जीव विज्ञान में उच्च ज्ञान', 
      color: 'emerald' 
    },
    'night-owl': { 
      name: 'नाइट आउल', 
      description: '15 बार रात 12 बजे के बाद अध्ययन किया', 
      color: 'slate' 
    },
    'geography-pro': { 
      name: 'भूगोल प्रो', 
      description: 'भूगोल में उत्कृष्ट प्रदर्शन', 
      color: 'cyan' 
    },
    'quick-learner': { 
      name: 'त्वरित शिक्षार्थी', 
      description: 'नए विषयों को तेजी से समझने की क्षमता', 
      color: 'pink' 
    },
    'computer-genius': { 
      name: 'कंप्यूटर जीनियस', 
      description: 'प्रोग्रामिंग और कंप्यूटर विज्ञान में विशेषज्ञता', 
      color: 'sky' 
    },
    'problem-solver': { 
      name: 'समस्या समाधानकर्ता', 
      description: '100 से अधिक जटिल समस्याएं हल कीं', 
      color: 'red' 
    },
    'language-expert': { 
      name: 'भाषा विशेषज्ञ', 
      description: 'कई भाषाओं में प्रवीणता', 
      color: 'violet' 
    },
    'dedicated-student': { 
      name: 'समर्पित विद्यार्थी', 
      description: '500 घंटे से अधिक अध्ययन पूरा किया', 
      color: 'lime' 
    },
    'economics-master': { 
      name: 'अर्थशास्त्र मास्टर', 
      description: 'अर्थशास्त्र में विशेषज्ञता', 
      color: 'fuchsia' 
    },
    'rising-star': { 
      name: 'उभरता सितारा', 
      description: 'प्रगति की तेज गति', 
      color: 'amber' 
    },
    'art-enthusiast': { 
      name: 'कला प्रेमी', 
      description: 'कला और डिजाइन में रुचि और कौशल', 
      color: 'purple' 
    },
    'team-player': { 
      name: 'टीम प्लेयर', 
      description: '10 से अधिक सामूहिक अध्ययन सत्रों में भाग लिया', 
      color: 'green' 
    },
  };
  
  return badges[badgeId] || { name: 'अज्ञात बैज', description: 'बैज विवरण उपलब्ध नहीं है', color: 'gray' };
};

// Get badge icon based on badge ID
export const getBadgeIcon = (badgeId: string): string => {
  // This would ideally return the correct icon path based on the badge ID
  // For now, we're returning a simple placeholder
  return badgeId;
};
