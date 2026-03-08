import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify admin using user's token
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, userId, blocked, points } = await req.json();

    if (action === 'list') {
      // Get all profiles
      const { data: profiles, error: profErr } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profErr) throw profErr;

      // Get all user_points
      const { data: allPoints } = await adminClient
        .from('user_points')
        .select('*');

      // Get all user_roles
      const { data: allRoles } = await adminClient
        .from('user_roles')
        .select('*');

      // Get auth users for last sign in
      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

      const enriched = (profiles || []).map((p: any) => {
        const pts = (allPoints || []).find((pt: any) => pt.user_id === p.user_id);
        const roles = (allRoles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role);
        const authUser = (authUsers || []).find((u: any) => u.id === p.user_id);
        return {
          ...p,
          balance: pts?.balance || 0,
          xp: pts?.xp || 0,
          level_pts: pts?.level || 1,
          credits: pts?.credits || 0,
          roles,
          last_sign_in: authUser?.last_sign_in_at || null,
          auth_provider: authUser?.app_metadata?.provider || p.provider,
          confirmed: !!authUser?.email_confirmed_at,
        };
      });

      return new Response(JSON.stringify({ users: enriched, total: enriched.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'block' && userId) {
      const { error } = await adminClient
        .from('profiles')
        .update({ is_blocked: blocked })
        .eq('user_id', userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_points' && userId) {
      const { error } = await adminClient
        .from('user_points')
        .update({ balance: points })
        .eq('user_id', userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin users error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
