import { supabase } from '@/integrations/supabase/client';
import { PointRecord } from './types';
import { toast } from 'sonner';
import { safeInvokeWithAuthRetry } from '@/lib/auth/sessionRecovery';
import { updateUserPointsCache } from './cache';

export interface PointsBalanceResponse {
  balance: number;
  level: number;
  credits?: number;
}

export async function fetchUserPointsBalance(userId: string): Promise<PointsBalanceResponse | null> {
  if (!userId) return null;

  const { data, error } = await safeInvokeWithAuthRetry(
    (body) => supabase.functions.invoke('points-balance', { body }),
    { userId }
  );

  if (error || !data) {
    if (error) {
      console.error('Error fetching points balance:', error);
    }
    return null;
  }

  const snapshot = {
    balance: data.balance ?? 0,
    level: data.level ?? 1,
    credits: data.credits,
  };

  updateUserPointsCache(userId, {
    points: snapshot.balance,
    level: snapshot.level,
    credits: snapshot.credits,
  });

  return snapshot;
}

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
    const { data, error } = await safeInvokeWithAuthRetry(
      (body) => supabase.functions.invoke('points-add', { body }),
      {
        userId,
        amount: points,
        reason: description,
        transactionType: type,
        metadata: { type }
      }
    );

    if (error) {
      console.error('Error calling points-add:', error);
      throw error;
    }

    if (!data?.success) {
      throw new Error('Failed to add points');
    }

    console.log(`Points added successfully. New balance: ${data.balance}`);
    
    updateUserPointsCache(userId, {
      points: data.balance ?? 0,
      level: data.level ?? 1,
      credits: data.credits,
    });
    
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

// Deprecated: points now use DB as the only source of truth.
// Kept as a no-op for backward compatibility with existing callers.
export async function migrateLocalStoragePoints(userId: string): Promise<void> {
  if (!userId) return;

  console.info('migrateLocalStoragePoints is deprecated and now intentionally skipped.');
}

// Sync user points from server on login
export async function syncUserPoints(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // Fetch current balance from server and refresh in-memory cache.
    const snapshot = await fetchUserPointsBalance(userId);
    if (snapshot) {
      console.log(`Synced points from server: ${snapshot.balance} points, level ${snapshot.level}`);
    }
  } catch (error) {
    console.error('Error syncing user points:', error);
  }
}

// Credits functions
export async function addCreditsToUser(
  userId: string,
  credits: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data, error } = await safeInvokeWithAuthRetry(
      (body) => supabase.functions.invoke('credits-add', { body }),
      { userId, credits, reason, metadata }
    );

    if (error) {
      console.error('Error adding credits:', error);
      throw error;
    }

    if (data?.success) {
      console.log(`Successfully added ${credits} credits. New balance: ${data.credits}`);
      // Update localStorage for offline access
      localStorage.setItem(`${userId}_credits`, data.credits.toString());
    }
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

export async function deductCreditsFromUser(
  userId: string,
  credits: number,
  feature: string,
  description: string
): Promise<boolean> {
  try {
    const { data, error } = await safeInvokeWithAuthRetry(
      (body) => supabase.functions.invoke('credits-deduct', { body }),
      { userId, credits, feature, description }
    );

    if (error) {
      if (error.message?.includes('Insufficient credits')) {
        toast.error('क्रेडिट कम हैं! कृपया क्रेडिट खरीदें या पॉइंट्स को कन्वर्ट करें।');
        return false;
      }
      console.error('Error deducting credits:', error);
      return false;
    }

    if (data?.success) {
      console.log(`Successfully deducted ${credits} credits. New balance: ${data.credits}`);
      // Update localStorage for offline access
      localStorage.setItem(`${userId}_credits`, data.credits.toString());
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deducting credits:', error);
    if (error.message?.includes('Insufficient credits')) {
      toast.error('क्रेडिट कम हैं! कृपया क्रेडिट खरीदें या पॉइंट्स को कन्वर्ट करें।');
    }
    return false;
  }
}

export async function convertPointsToCredits(
  userId: string,
  points: number
): Promise<boolean> {
  try {
    if (points < 1000) {
      toast.error('कम से कम 1000 पॉइंट्स की आवश्यकता है!');
      return false;
    }

    const { data, error } = await safeInvokeWithAuthRetry(
      (body) => supabase.functions.invoke('points-to-credits', { body }),
      { userId, points }
    );

    if (error) {
      console.error('Error converting points:', error);
      toast.error('पॉइंट्स कन्वर्ट करने में त्रुटि!');
      return false;
    }

    if (data?.success) {
      toast.success(`${data.creditsAdded} क्रेडिट प्राप्त हुए!`);
      // Update localStorage
      localStorage.setItem(`${userId}_credits`, data.newCreditsBalance.toString());
      updateUserPointsCache(userId, {
        points: data.newPointsBalance ?? 0,
        level: data.newLevel ?? 1,
        credits: data.newCreditsBalance,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error converting points:', error);
    toast.error('पॉइंट्स कन्वर्ट करने में त्रुटि!');
    return false;
  }
}
