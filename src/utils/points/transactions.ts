import { supabase } from '@/integrations/supabase/client';

export interface SupabasePointsTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  reason: string;
  metadata: any;
  created_at: string;
}

export interface DisplayTransaction {
  type: 'credit' | 'deduction';
  amount: number;
  feature?: string;
  description: string;
  timestamp: string;
  balanceAfter: number;
}

export async function fetchUserTransactions(userId: string, limit: number = 50): Promise<DisplayTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform Supabase transactions to display format
    return data.map((txn: SupabasePointsTransaction) => ({
      type: txn.amount > 0 ? 'credit' : 'deduction',
      amount: Math.abs(txn.amount),
      feature: txn.metadata?.featureKey,
      description: txn.reason,
      timestamp: txn.created_at,
      balanceAfter: txn.balance_after,
    }));
  } catch (error) {
    console.error('Error in fetchUserTransactions:', error);
    return [];
  }
}
