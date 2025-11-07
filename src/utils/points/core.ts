
import { supabase } from '@/integrations/supabase/client';
import { PointRecord } from './types';

export async function addPointsToUser(
  userId: string,
  points: number,
  type: PointRecord['type'],
  description: string
): Promise<void> {
  if (!userId) return;
  
  try {
    console.log(`Adding ${points} points to user ${userId} for: ${description}`);
    
    // Call secure edge function to add points
    const { data, error } = await supabase.functions.invoke('points-add', {
      body: {
        amount: points,
        reason: description,
        transactionType: type === 'quiz' ? 'achievement' : type,
        metadata: { type }
      }
    });

    if (error) {
      console.error('Error calling points-add:', error);
      throw error;
    }

    if (!data?.success) {
      throw new Error('Failed to add points');
    }

    console.log(`Points added successfully. New balance: ${data.balance}`);
    
    // Update localStorage for optimistic UI updates only
    localStorage.setItem(`${userId}_points`, data.balance.toString());
    localStorage.setItem(`${userId}_level`, data.level.toString());
    
  } catch (error) {
    console.error("Error in addPointsToUser:", error);
    throw error;
  }
}

export function addPointRecord(userId: string, record: PointRecord): void {
  if (!userId) return;
  
  const historyKey = `${userId}_points_history`;
  const existingHistory = localStorage.getItem(historyKey);
  
  const history = existingHistory ? JSON.parse(existingHistory) : [];
  history.push(record);
  
  // Keep only last 100 records to prevent localStorage bloat
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  
  localStorage.setItem(historyKey, JSON.stringify(history));
  console.log(`Points history record added to localStorage: ${record.points} points for ${record.description}`);
}

// Sync user points from server on login
export async function syncUserPoints(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // Fetch current balance from server
    const { data, error } = await supabase.functions.invoke('points-balance');
    
    if (error) {
      console.error('Error fetching points balance:', error);
      return;
    }

    if (data) {
      // Update localStorage with server values
      localStorage.setItem(`${userId}_points`, data.balance.toString());
      localStorage.setItem(`${userId}_level`, data.level.toString());
      console.log(`Synced points from server: ${data.balance} points, level ${data.level}`);
    }
  } catch (error) {
    console.error('Error syncing user points:', error);
  }
}
