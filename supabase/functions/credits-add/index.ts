import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { userId, credits, reason, metadata } = await req.json();

    if (!userId || !credits) {
      return new Response(
        JSON.stringify({ error: 'userId and credits are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Adding ${credits} credits to user ${userId} for reason: ${reason}`);

    // Get current credits
    const { data: userData, error: fetchError } = await supabaseClient
      .from('user_points')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentCredits = userData?.credits || 0;
    const newCredits = currentCredits + credits;

    // Update credits
    const { error: updateError } = await supabaseClient
      .from('user_points')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record transaction
    const { error: transactionError } = await supabaseClient
      .from('points_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        balance_after: newCredits,
        transaction_type: 'credit',
        reason: reason || 'Credits added',
        metadata: metadata || {}
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    }

    console.log(`Successfully added ${credits} credits. New balance: ${newCredits}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        credits: newCredits,
        added: credits 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in credits-add function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
