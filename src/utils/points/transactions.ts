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
    // Use edge function to fetch transactions (bypasses RLS issues with Firebase auth)
    const { data, error } = await supabase.functions.invoke('points-transactions', {
      body: { userId, limit }
    });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    if (!data?.transactions || data.transactions.length === 0) {
      return [];
    }

    // Transform Supabase transactions to display format
    return data.transactions.map((txn: SupabasePointsTransaction) => ({
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
