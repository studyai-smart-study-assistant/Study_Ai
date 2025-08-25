// Edge function: account-purge
// Deletes Supabase data for a given Firebase UID: profiles row + avatar files

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
    const { uid } = await req.json();
    if (!uid || typeof uid !== 'string') {
      return new Response(JSON.stringify({ error: 'uid is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Delete profile row
    const { error: profileError } = await supabase.from('profiles').delete().eq('user_id', uid);

    // Delete avatar files in bucket 'avatars' under folder uid/
    const { data: list, error: listError } = await supabase.storage.from('avatars').list(uid, { limit: 100 });

    let storageError: any = null;
    if (!listError && Array.isArray(list) && list.length > 0) {
      const paths = list.map((f) => `${uid}/${f.name}`);
      const { error: removeError } = await supabase.storage.from('avatars').remove(paths);
      storageError = removeError ?? null;
    }

    const ok = !profileError && !storageError;

    return new Response(
      JSON.stringify({ ok, profileError, storageError }),
      { status: ok ? 200 : 207, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid request', details: String(e) }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
