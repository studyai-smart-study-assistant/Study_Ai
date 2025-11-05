// Feature locking system based on points

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

  // Get current points
  const currentPoints = parseInt(localStorage.getItem(`${userId}_points`) || '0');

  // Check if user has enough points
  if (currentPoints < feature.cost) {
    return {
      success: false,
      message: `आपके पास पर्याप्त पॉइंट्स नहीं हैं। आवश्यक: ${feature.cost}, उपलब्ध: ${currentPoints}`
    };
  }

  // Deduct points
  const newPoints = currentPoints - feature.cost;
  localStorage.setItem(`${userId}_points`, newPoints.toString());

  // Log transaction
  logPointsTransaction(userId, {
    type: 'deduction',
    amount: feature.cost,
    feature: feature.name,
    description: `${feature.description} के लिए`,
    timestamp: new Date().toISOString(),
    balanceAfter: newPoints
  });

  return {
    success: true,
    message: `${feature.cost} पॉइंट्स कटे। शेष: ${newPoints}`,
    remainingPoints: newPoints
  };
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

export function canAccessFeature(userId: string, featureKey: string): boolean {
  const feature = FEATURE_COSTS[featureKey];
  if (!feature) return false;
  
  const currentPoints = parseInt(localStorage.getItem(`${userId}_points`) || '0');
  return currentPoints >= feature.cost;
}
