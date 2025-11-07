import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeductPointsRequest {
  userId: string;
  featureKey: string;
  amount: number;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, featureKey, amount, reason }: DeductPointsRequest = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!reason || !featureKey) {
      throw new Error('Missing required fields');
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current points
    const { data: userPoints, error: fetchError } = await supabaseAdmin
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user points:', fetchError);
      throw fetchError;
    }

    const currentBalance = userPoints?.balance ?? 0;

    // Check if user has enough points
    if (currentBalance < amount) {
      console.log(`Insufficient balance: user ${userId} has ${currentBalance}, needs ${amount}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INSUFFICIENT_BALANCE',
          message: `आपके पास पर्याप्त पॉइंट्स नहीं हैं। आवश्यक: ${amount}, उपलब्ध: ${currentBalance}`,
          currentBalance,
          required: amount,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newBalance = currentBalance - amount;

    // Update user points
    const { error: updateError } = await supabaseAdmin
      .from('user_points')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating points:', updateError);
      throw updateError;
    }

    // Log transaction
    const { error: transactionError } = await supabaseAdmin
      .from('points_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'deduction',
        amount: -amount,
        balance_after: newBalance,
        reason,
        metadata: { featureKey },
      });

    if (transactionError) {
      console.error('Error logging transaction:', transactionError);
      throw transactionError;
    }

    console.log(`Points deducted: ${amount} from user ${userId}. New balance: ${newBalance}`);

    return new Response(
      JSON.stringify({
        success: true,
        balance: newBalance,
        previousBalance: currentBalance,
        deducted: amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in points-deduct:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
