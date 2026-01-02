import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CREDITS_PER_AD = 20;
const MAX_ADS_PER_DAY = 20;

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

    const { userId, action } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's date string for tracking daily limits
    const today = new Date().toISOString().split('T')[0];
    const adTrackingKey = `ad_views_${today}`;

    // Get current user data
    const { data: userData, error: fetchError } = await supabaseClient
      .from('user_points')
      .select('credits, balance, xp, level')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user data:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check how many ads user has watched today from transactions
    const { data: todayAds, error: adsError } = await supabaseClient
      .from('points_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reason', 'प्रचार देखकर क्रेडिट्स कमाए')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`);

    const adsWatchedToday = todayAds?.length || 0;

    // If action is 'check', just return current status
    if (action === 'check') {
      return new Response(
        JSON.stringify({
          success: true,
          adsWatchedToday,
          maxAdsPerDay: MAX_ADS_PER_DAY,
          canWatchMore: adsWatchedToday < MAX_ADS_PER_DAY,
          creditsPerAd: CREDITS_PER_AD,
          remainingAds: Math.max(0, MAX_ADS_PER_DAY - adsWatchedToday)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has reached daily limit
    if (adsWatchedToday >= MAX_ADS_PER_DAY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Daily ad limit reached',
          message: 'आपने आज की अधिकतम प्रचार देख लिए हैं। कल फिर से आएं!',
          adsWatchedToday,
          maxAdsPerDay: MAX_ADS_PER_DAY
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Award credits for watching ad
    const currentCredits = userData?.credits || 0;
    const newCredits = currentCredits + CREDITS_PER_AD;

    // Update or insert user credits
    if (userData) {
      const { error: updateError } = await supabaseClient
        .from('user_points')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { error: insertError } = await supabaseClient
        .from('user_points')
        .insert({
          user_id: userId,
          credits: CREDITS_PER_AD,
          balance: 0,
          xp: 0,
          level: 1
        });

      if (insertError) {
        console.error('Error inserting user:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Record transaction
    await supabaseClient.from('points_transactions').insert({
      user_id: userId,
      amount: CREDITS_PER_AD,
      balance_after: newCredits,
      transaction_type: 'credit',
      reason: 'प्रचार देखकर क्रेडिट्स कमाए',
      metadata: {
        type: 'ad_reward',
        ad_number: adsWatchedToday + 1,
        date: today
      }
    });

    console.log(`User ${userId} earned ${CREDITS_PER_AD} credits for watching ad #${adsWatchedToday + 1}`);

    return new Response(
      JSON.stringify({
        success: true,
        creditsEarned: CREDITS_PER_AD,
        newCreditsBalance: newCredits,
        adsWatchedToday: adsWatchedToday + 1,
        remainingAds: Math.max(0, MAX_ADS_PER_DAY - (adsWatchedToday + 1)),
        maxAdsPerDay: MAX_ADS_PER_DAY
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ad-reward function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
