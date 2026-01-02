import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CREDITS_PER_AD = 20;
const MAX_ADS_PER_DAY = 20;
const MIN_VIEW_TIME_SECONDS = 20; // Minimum time user must view ad
const AD_COOLDOWN_SECONDS = 120; // 2 minutes between ads

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

    const { userId, action, viewedTime, timestamp } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's date string for tracking daily limits
    const today = new Date().toISOString().split('T')[0];

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
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('reason', 'प्रचार देखकर क्रेडिट्स कमाए')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    const adsWatchedToday = todayAds?.length || 0;
    const lastAdTime = todayAds?.[0]?.created_at ? new Date(todayAds[0].created_at) : null;

    // If action is 'check', just return current status
    if (action === 'check') {
      // Check cooldown
      let cooldownRemaining = 0;
      if (lastAdTime) {
        const timeSinceLastAd = (Date.now() - lastAdTime.getTime()) / 1000;
        cooldownRemaining = Math.max(0, AD_COOLDOWN_SECONDS - timeSinceLastAd);
      }

      return new Response(
        JSON.stringify({
          success: true,
          adsWatchedToday,
          maxAdsPerDay: MAX_ADS_PER_DAY,
          canWatchMore: adsWatchedToday < MAX_ADS_PER_DAY && cooldownRemaining === 0,
          creditsPerAd: CREDITS_PER_AD,
          remainingAds: Math.max(0, MAX_ADS_PER_DAY - adsWatchedToday),
          cooldownRemaining: Math.ceil(cooldownRemaining),
          minViewTime: MIN_VIEW_TIME_SECONDS
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CLAIM ACTION - STRICT VALIDATION
    if (action === 'claim') {
      // 1. Check daily limit
      if (adsWatchedToday >= MAX_ADS_PER_DAY) {
        console.log(`User ${userId} exceeded daily limit: ${adsWatchedToday}/${MAX_ADS_PER_DAY}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'आज की अधिकतम प्रचार देख लिए हैं',
            message: 'कल फिर से आएं!',
            adsWatchedToday,
            maxAdsPerDay: MAX_ADS_PER_DAY
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Check cooldown (prevent rapid-fire claims)
      if (lastAdTime) {
        const timeSinceLastAd = (Date.now() - lastAdTime.getTime()) / 1000;
        if (timeSinceLastAd < AD_COOLDOWN_SECONDS) {
          const waitTime = Math.ceil(AD_COOLDOWN_SECONDS - timeSinceLastAd);
          console.log(`User ${userId} cooldown active: ${waitTime}s remaining`);
          return new Response(
            JSON.stringify({
              success: false,
              error: `कृपया ${waitTime} सेकंड प्रतीक्षा करें`,
              cooldownRemaining: waitTime
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 3. Validate viewed time from client (with some tolerance)
      if (typeof viewedTime !== 'number' || viewedTime < MIN_VIEW_TIME_SECONDS - 2) {
        console.log(`User ${userId} insufficient view time: ${viewedTime}s < ${MIN_VIEW_TIME_SECONDS}s`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `प्रचार कम से कम ${MIN_VIEW_TIME_SECONDS} सेकंड देखना आवश्यक है`,
            viewedTime: viewedTime || 0,
            requiredTime: MIN_VIEW_TIME_SECONDS
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 4. Validate timestamp (prevent replay attacks - claim must be recent)
      if (timestamp) {
        const claimAge = Date.now() - timestamp;
        if (claimAge > 60000) { // Claim older than 60 seconds
          console.log(`User ${userId} stale claim: ${claimAge}ms old`);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'सत्र समाप्त हो गया, पुनः प्रयास करें'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // ALL VALIDATIONS PASSED - Award credits
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

      // Record transaction with verification metadata
      await supabaseClient.from('points_transactions').insert({
        user_id: userId,
        amount: CREDITS_PER_AD,
        balance_after: newCredits,
        transaction_type: 'credit',
        reason: 'प्रचार देखकर क्रेडिट्स कमाए',
        metadata: {
          type: 'ad_reward',
          ad_number: adsWatchedToday + 1,
          date: today,
          viewed_time: viewedTime,
          verified_at: new Date().toISOString(),
          client_timestamp: timestamp
        }
      });

      console.log(`✓ User ${userId} earned ${CREDITS_PER_AD} credits for watching ad #${adsWatchedToday + 1} (viewed ${viewedTime}s)`);

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
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ad-reward function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});