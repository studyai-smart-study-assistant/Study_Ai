// Feature locking system based on points
import { supabase } from '@/integrations/supabase/client';

export interface FeatureCost {
  name: string;
  cost: number;
  description: string;
  icon: string;
}

export const FEATURE_COSTS: Record<string, FeatureCost> = {
  teacher_mode: {
    name: 'Teacher Mode',
    cost: 10,
    description: 'शिक्षक मोड एक्सेस',
    icon: '👨‍🏫'
  },
  notes_generation: {
    name: 'Notes Generation',
    cost: 10,
    description: 'नोट्स जेनरेशन',
    icon: '📝'
  },
  quiz_generation: {
    name: 'Quiz Generation',
    cost: 5,
    description: 'क्विज़ जेनरेशन',
    icon: '📋'
  },
  homework: {
    name: 'Homework',
    cost: 3,
    description: 'होमवर्क सहायता',
    icon: '📚'
  },
  motivation: {
    name: 'Motivation',
    cost: 2,
    description: 'प्रेरणा संदेश',
    icon: '💪'
  },
  study_plan: {
    name: 'Study Plan',
    cost: 5,
    description: 'अध्ययन योजना',
    icon: '📅'
  }
};

export async function deductPointsForFeature(
  userId: string,
  featureKey: string
): Promise<{ success: boolean; message: string; remainingPoints?: number }> {
  if (!userId) {
    return { success: false, message: 'User ID required' };
  }

  const feature = FEATURE_COSTS[featureKey];
  if (!feature) {
    return { success: false, message: 'Invalid feature' };
  }

  try {
    // Call secure edge function to deduct points
    const { data, error } = await supabase.functions.invoke('points-deduct', {
      body: {
        userId,
        featureKey,
        amount: feature.cost,
        reason: `${feature.description} के लिए`
      }
    });

    if (error) {
      console.error('Error calling points-deduct:', error);
      return {
        success: false,
        message: 'पॉइंट्स काटने में त्रुटि हुई'
      };
    }

    if (!data?.success) {
      return {
        success: false,
        message: data?.message || `आपके पास पर्याप्त पॉइंट्स नहीं हैं। आवश्यक: ${feature.cost}`
      };
    }

    // Update localStorage for optimistic UI
    localStorage.setItem(`${userId}_points`, data.balance.toString());

    console.log(`Points deducted: ${feature.cost}. New balance: ${data.balance}`);

    return {
      success: true,
      message: `${feature.cost} पॉइंट्स कटे। शेष: ${data.balance}`,
      remainingPoints: data.balance
    };
  } catch (error) {
    console.error('Error in deductPointsForFeature:', error);
    return {
      success: false,
      message: 'पॉइंट्स काटने में त्रुटि हुई'
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
  const feature = FEATURE_COSTS[featureKey];
  if (!feature) return false;
  
  try {
    // Check server balance
    const { data, error } = await supabase.functions.invoke('points-balance', {
      body: { userId }
    });
    
    if (error || !data) {
      // Fallback to localStorage
      const currentPoints = parseInt(localStorage.getItem(`${userId}_points`) || '0');
      return currentPoints >= feature.cost;
    }
    
    return data.balance >= feature.cost;
  } catch (error) {
    console.error('Error checking feature access:', error);
    // Fallback to localStorage
    const currentPoints = parseInt(localStorage.getItem(`${userId}_points`) || '0');
    return currentPoints >= feature.cost;
  }
}
