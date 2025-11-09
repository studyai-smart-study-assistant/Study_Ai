// Feature locking system based on credits (not points)
import { supabase } from '@/integrations/supabase/client';
import { deductCreditsForFeature, FEATURE_COSTS, FeatureType } from './credits';

export interface FeatureCost {
  name: string;
  cost: number;
  description: string;
  icon: string;
}

// Export feature costs for UI display
export const FEATURE_COSTS_DISPLAY: Record<string, FeatureCost> = {
  teacher_mode: {
    name: 'Teacher Mode',
    cost: FEATURE_COSTS.teacher_mode,
    description: 'शिक्षक मोड एक्सेस',
    icon: '👨‍🏫'
  },
  notes_generation: {
    name: 'Notes Generation',
    cost: FEATURE_COSTS.notes_generator,
    description: 'नोट्स जेनरेशन',
    icon: '📝'
  },
  quiz_generation: {
    name: 'Quiz Generation',
    cost: FEATURE_COSTS.quiz_generator,
    description: 'क्विज़ जेनरेशन',
    icon: '📋'
  },
  homework: {
    name: 'Homework',
    cost: FEATURE_COSTS.homework_assistant,
    description: 'होमवर्क सहायता',
    icon: '📚'
  },
  motivation: {
    name: 'Motivation',
    cost: FEATURE_COSTS.motivation_system,
    description: 'प्रेरणा संदेश',
    icon: '💪'
  },
  study_plan: {
    name: 'Study Plan',
    cost: FEATURE_COSTS.study_planner,
    description: 'अध्ययन योजना',
    icon: '📅'
  }
};

// Map old feature keys to new FeatureType keys
const FEATURE_KEY_MAP: Record<string, FeatureType> = {
  'teacher_mode': 'teacher_mode',
  'notes_generation': 'notes_generator',
  'quiz_generation': 'quiz_generator',
  'homework': 'homework_assistant',
  'motivation': 'motivation_system',
  'study_plan': 'study_planner'
};

export async function deductPointsForFeature(
  userId: string,
  featureKey: string
): Promise<{ success: boolean; message: string; remainingCredits?: number }> {
  if (!userId) {
    return { success: false, message: 'User ID required' };
  }

  const mappedKey = FEATURE_KEY_MAP[featureKey];
  if (!mappedKey) {
    return { success: false, message: 'Invalid feature' };
  }

  const feature = FEATURE_COSTS_DISPLAY[featureKey];
  if (!feature) {
    return { success: false, message: 'Invalid feature' };
  }

  try {
    const success = await deductCreditsForFeature(userId, mappedKey);
    
    if (!success) {
      return {
        success: false,
        message: `आपके पास पर्याप्त क्रेडिट नहीं हैं। आवश्यक: ${feature.cost}`
      };
    }

    // Get updated balance
    const currentCredits = parseInt(localStorage.getItem(`${userId}_credits`) || '0');

    return {
      success: true,
      message: `${feature.cost} क्रेडिट कटे। शेष: ${currentCredits}`,
      remainingCredits: currentCredits
    };
  } catch (error) {
    console.error('Error in deductPointsForFeature:', error);
    return {
      success: false,
      message: 'क्रेडिट काटने में त्रुटि हुई'
    };
  }
}

export interface PointsTransaction {
  type: 'credit' | 'deduction';
  amount: number;
  feature?: string;
  description: string;
  timestamp: string;
  balanceAfter: number;
}

export function logPointsTransaction(userId: string, transaction: PointsTransaction): void {
  const historyKey = `${userId}_points_transactions`;
  const existingHistory = localStorage.getItem(historyKey);
  
  const history: PointsTransaction[] = existingHistory ? JSON.parse(existingHistory) : [];
  history.push(transaction);
  
  // Keep only last 200 transactions
  if (history.length > 200) {
    history.splice(0, history.length - 200);
  }
  
  localStorage.setItem(historyKey, JSON.stringify(history));
}

export function getPointsTransactions(userId: string, limit: number = 50): PointsTransaction[] {
  if (!userId) return [];
  
  const historyKey = `${userId}_points_transactions`;
  const savedHistory = localStorage.getItem(historyKey);
  
  if (!savedHistory) {
    return [];
  }
  
  const history: PointsTransaction[] = JSON.parse(savedHistory);
  
  // Sort by timestamp (newest first) and limit
  return history
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function canAccessFeature(userId: string, featureKey: string): Promise<boolean> {
  const mappedKey = FEATURE_KEY_MAP[featureKey];
  if (!mappedKey) return false;
  
  const cost = FEATURE_COSTS[mappedKey];
  
  try {
    // Check server balance
    const { data, error } = await supabase.functions.invoke('points-balance', {
      body: { userId }
    });
    
    if (error || !data) {
      // Fallback to localStorage
      const currentCredits = parseInt(localStorage.getItem(`${userId}_credits`) || '0');
      return currentCredits >= cost;
    }
    
    return (data.credits || 0) >= cost;
  } catch (error) {
    console.error('Error checking feature access:', error);
    // Fallback to localStorage
    const currentCredits = parseInt(localStorage.getItem(`${userId}_credits`) || '0');
    return currentCredits >= cost;
  }
}
