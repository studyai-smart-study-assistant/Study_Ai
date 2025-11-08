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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user points
    const { data: userPoints, error: fetchError } = await supabaseAdmin
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user points:', fetchError);
      throw fetchError;
    }

    // If no record exists, create one
    if (!userPoints) {
      const { data: newPoints, error: insertError } = await supabaseAdmin
        .from('user_points')
        .insert({
          user_id: userId,
          balance: 0,
          level: 1,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user points:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({
          balance: 0,
          xp: 0,
          level: 1,
          created_at: newPoints.created_at,
          updated_at: newPoints.updated_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        balance: userPoints.balance,
        xp: userPoints.xp || 0,
        level: userPoints.level,
        created_at: userPoints.created_at,
        updated_at: userPoints.updated_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in points-balance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
