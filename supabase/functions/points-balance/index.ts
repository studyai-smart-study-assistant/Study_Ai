import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Retry exhausted');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: userPoints, error: fetchError } = await supabaseAdmin
      .from('user_points')
      .select('balance, xp, level, credits, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user points:', fetchError);
      throw new Error(typeof fetchError === 'object' ? (fetchError as any).message || 'DB fetch failed' : String(fetchError));
    }

    if (!userPoints) {
      const { data: newPoints, error: insertError } = await supabaseAdmin
        .from('user_points')
        .insert({
          user_id: userId,
          balance: 1000,
          level: 1,
          xp: 0,
          credits: 100,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user points:', insertError);
        throw new Error('Failed to create user points');
      }

      return new Response(
        JSON.stringify({
          balance: 1000, xp: 0, level: 1, credits: 100,
          created_at: newPoints.created_at, updated_at: newPoints.updated_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        balance: userPoints.balance, xp: userPoints.xp || 0,
        level: userPoints.level, credits: userPoints.credits || 0,
        created_at: userPoints.created_at, updated_at: userPoints.updated_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const msg = (error as Error)?.message || 'Unknown error';
    // Don't leak HTML error pages to client
    const safeMsg = msg.includes('<!DOCTYPE') ? 'Service temporarily unavailable' : msg;
    console.error('Error in points-balance:', safeMsg);
    return new Response(
      JSON.stringify({ error: safeMsg }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
