import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONVERSION_RATE = 50; // 5000 points = 100 credits (50:1 ratio)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId, points } = await req.json();

    if (!userId || !points || points < 5000) {
      return new Response(
        JSON.stringify({ error: 'Minimum 5000 points required for conversion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Converting ${points} points to credits for user ${userId}`);

    // Get current balance
    const { data: userData, error: fetchError } = await supabaseClient
      .from('user_points')
      .select('balance, xp, credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentPoints = userData?.balance || 0;
    const currentXP = userData?.xp || 0;
    const currentCredits = userData?.credits || 0;

    // Check if user has enough points
    if (currentPoints < points) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient points',
          currentPoints,
          required: points
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creditsToAdd = Math.floor(points / CONVERSION_RATE);
    const newPoints = currentPoints - points;
    const newCredits = currentCredits + creditsToAdd;

    // Update both points and credits
    const { error: updateError } = await supabaseClient
      .from('user_points')
      .update({ 
        balance: newPoints,
        credits: newCredits,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record transactions
    await supabaseClient.from('points_transactions').insert([
      {
        user_id: userId,
        amount: points,
        balance_after: newPoints,
        transaction_type: 'debit',
        reason: `Converted ${points} points to ${creditsToAdd} credits`,
        metadata: { conversion: true, creditsReceived: creditsToAdd }
      },
      {
        user_id: userId,
        amount: creditsToAdd,
        balance_after: newCredits,
        transaction_type: 'credit',
        reason: `Received ${creditsToAdd} credits from ${points} points conversion`,
        metadata: { conversion: true, pointsSpent: points }
      }
    ]);

    console.log(`Successfully converted ${points} points to ${creditsToAdd} credits`);

    return new Response(
      JSON.stringify({ 
        success: true,
        pointsDeducted: points,
        creditsAdded: creditsToAdd,
        newPointsBalance: newPoints,
        newCreditsBalance: newCredits
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in points-to-credits function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
