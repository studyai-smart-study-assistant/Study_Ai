import { supabase } from '@/integrations/supabase/client';
import { PointRecord } from './types';
import { toast } from 'sonner';

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
        userId,
        amount: points,
        reason: description,
        transactionType: type,
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

// Migrate localStorage points to database on first login
export async function migrateLocalStoragePoints(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // Get points from localStorage
    const localPoints = parseInt(localStorage.getItem(`${userId}_points`) || '0');
    
    if (localPoints <= 0) {
      console.log('No points to migrate from localStorage');
      return;
    }
    
    // Fetch current balance from server
    const { data: balanceData, error: balanceError } = await supabase.functions.invoke('points-balance', {
      body: { userId }
    });
    
    if (balanceError) {
      console.error('Error fetching balance for migration:', balanceError);
      return;
    }
    
    const serverPoints = balanceData?.balance || 0;
    
    // Only migrate if server has fewer points than localStorage
    if (serverPoints < localPoints) {
      const pointsToAdd = localPoints - serverPoints;
      console.log(`Migrating ${pointsToAdd} points from localStorage to database`);
      
      // Add the difference to server
      const { data: addData, error: addError } = await supabase.functions.invoke('points-add', {
        body: {
          userId,
          amount: pointsToAdd,
          reason: 'पिछले points का migration',
          transactionType: 'credit',
          metadata: { migration: true, source: 'localStorage' }
        }
      });
      
      if (addError) {
        console.error('Error migrating points:', addError);
        return;
      }
      
      if (addData?.success) {
        console.log(`✅ Successfully migrated ${pointsToAdd} points. New balance: ${addData.balance}`);
        localStorage.setItem(`${userId}_points`, addData.balance.toString());
        localStorage.setItem(`${userId}_level`, addData.level.toString());
      }
    } else {
      console.log(`Server already has more points (${serverPoints}) than localStorage (${localPoints})`);
      // Update localStorage with server values
      localStorage.setItem(`${userId}_points`, serverPoints.toString());
      localStorage.setItem(`${userId}_level`, balanceData.level.toString());
    }
  } catch (error) {
    console.error('Error in migrateLocalStoragePoints:', error);
  }
}

// Sync user points from server on login
export async function syncUserPoints(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // First, try to migrate any localStorage points
    await migrateLocalStoragePoints(userId);
    
    // Then fetch current balance from server
    const { data, error } = await supabase.functions.invoke('points-balance', {
      body: { userId }
    });
    
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

// Credits functions
export async function addCreditsToUser(
  userId: string,
  credits: number,
  reason: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('credits-add', {
      body: { userId, credits, reason, metadata }
    });

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
    const { data, error } = await supabase.functions.invoke('credits-deduct', {
      body: { userId, credits, feature, description }
    });

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

    const { data, error } = await supabase.functions.invoke('points-to-credits', {
      body: { userId, points }
    });

    if (error) {
      console.error('Error converting points:', error);
      toast.error('पॉइंट्स कन्वर्ट करने में त्रुटि!');
      return false;
    }

    if (data?.success) {
      toast.success(`${data.creditsAdded} क्रेडिट प्राप्त हुए!`);
      // Update localStorage
      localStorage.setItem(`${userId}_credits`, data.newCreditsBalance.toString());
      localStorage.setItem(`${userId}_points`, data.newPointsBalance.toString());
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error converting points:', error);
    toast.error('पॉइंट्स कन्वर्ट करने में त्रुटि!');
    return false;
  }
}
