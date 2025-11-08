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
    const { limit = 100 } = await req.json().catch(() => ({ limit: 100 }));

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user points ordered by XP (descending) for leaderboard
    const { data: userPoints, error: fetchError } = await supabaseAdmin
      .from('user_points')
      .select('user_id, xp, level, balance, created_at, updated_at')
      .order('xp', { ascending: false })
      .limit(limit);

    if (fetchError) {
      console.error('Error fetching leaderboard:', fetchError);
      throw fetchError;
    }

    // Fetch user profiles to get display names and avatars
    const userIds = userPoints?.map(p => p.user_id) || [];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Merge points and profiles
    const leaderboard = userPoints?.map((userPoint, index) => {
      const profile = profiles?.find(p => p.user_id === userPoint.user_id);
      return {
        id: userPoint.user_id,
        rank: index + 1,
        name: profile?.display_name || 'Student',
        avatar: profile?.avatar_url,
        xp: userPoint.xp,
        level: userPoint.level,
        balance: userPoint.balance,
      };
    }) || [];

    return new Response(
      JSON.stringify({ leaderboard }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in leaderboard:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
