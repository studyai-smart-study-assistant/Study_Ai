import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddPointsRequest {
  amount: number;
  reason: string;
  transactionType: 'credit' | 'bonus' | 'referral' | 'login' | 'achievement';
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { amount, reason, transactionType, metadata }: AddPointsRequest = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!reason || !transactionType) {
      throw new Error('Missing required fields');
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create user points record
    const { data: userPoints, error: fetchError } = await supabaseAdmin
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user points:', fetchError);
      throw fetchError;
    }

    const currentBalance = userPoints?.balance ?? 0;
    const newBalance = currentBalance + amount;
    const newLevel = Math.floor(newBalance / 100) + 1;

    // Update or insert user points
    const { error: upsertError } = await supabaseAdmin
      .from('user_points')
      .upsert({
        user_id: user.id,
        balance: newBalance,
        level: newLevel,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error updating points:', upsertError);
      throw upsertError;
    }

    // Log transaction
    const { error: transactionError } = await supabaseAdmin
      .from('points_transactions')
      .insert({
        user_id: user.id,
        transaction_type: transactionType,
        amount,
        balance_after: newBalance,
        reason,
        metadata: metadata || {},
      });

    if (transactionError) {
      console.error('Error logging transaction:', transactionError);
      throw transactionError;
    }

    console.log(`Points added: ${amount} to user ${user.id}. New balance: ${newBalance}`);

    return new Response(
      JSON.stringify({
        success: true,
        balance: newBalance,
        level: newLevel,
        previousBalance: currentBalance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in points-add:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
