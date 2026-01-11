// Edge function: account-purge
// Permanently deletes user account and all associated data

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
      return new Response(JSON.stringify({ error: 'uid is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const errors: string[] = [];

    // 1. Delete user_points
    const { error: pointsError } = await supabase
      .from('user_points')
      .delete()
      .eq('user_id', uid);
    if (pointsError) errors.push(`user_points: ${pointsError.message}`);

    // 2. Delete points_transactions
    const { error: transactionsError } = await supabase
      .from('points_transactions')
      .delete()
      .eq('user_id', uid);
    if (transactionsError) errors.push(`points_transactions: ${transactionsError.message}`);

    // 3. Delete profile row
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', uid);
    if (profileError) errors.push(`profiles: ${profileError.message}`);

    // 4. Delete chat messages (where user is sender)
    const { error: chatMsgError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('sender_id', uid);
    if (chatMsgError) errors.push(`chat_messages: ${chatMsgError.message}`);

    // 5. Delete campus messages
    const { error: campusMsgError } = await supabase
      .from('campus_messages')
      .delete()
      .eq('sender_uid', uid);
    if (campusMsgError) errors.push(`campus_messages: ${campusMsgError.message}`);

    // 6. Delete campus chats where user is participant
    const { error: campusChat1Error } = await supabase
      .from('campus_chats')
      .delete()
      .eq('participant1_uid', uid);
    if (campusChat1Error) errors.push(`campus_chats_p1: ${campusChat1Error.message}`);

    const { error: campusChat2Error } = await supabase
      .from('campus_chats')
      .delete()
      .eq('participant2_uid', uid);
    if (campusChat2Error) errors.push(`campus_chats_p2: ${campusChat2Error.message}`);

    // 7. Delete campus_users
    const { error: campusUserError } = await supabase
      .from('campus_users')
      .delete()
      .eq('firebase_uid', uid);
    if (campusUserError) errors.push(`campus_users: ${campusUserError.message}`);

    // 8. Delete avatar files in bucket 'avatars' under folder uid/
    const { data: avatarList, error: listError } = await supabase.storage
      .from('avatars')
      .list(uid, { limit: 100 });

    if (!listError && Array.isArray(avatarList) && avatarList.length > 0) {
      const paths = avatarList.map((f) => `${uid}/${f.name}`);
      const { error: removeError } = await supabase.storage.from('avatars').remove(paths);
      if (removeError) errors.push(`storage_avatars: ${removeError.message}`);
    }

    // 9. Delete chat_media files
    const { data: chatMediaList } = await supabase.storage
      .from('chat_media')
      .list(uid, { limit: 100 });

    if (Array.isArray(chatMediaList) && chatMediaList.length > 0) {
      const paths = chatMediaList.map((f) => `${uid}/${f.name}`);
      await supabase.storage.from('chat_media').remove(paths);
    }

    // 10. Delete user from auth.users (permanent deletion)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(uid);
    if (authDeleteError) errors.push(`auth.users: ${authDeleteError.message}`);

    const ok = errors.length === 0;

    return new Response(
      JSON.stringify({ ok, errors: errors.length > 0 ? errors : undefined }),
      { 
        status: ok ? 200 : 207, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'invalid request', details: String(e) }), 
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
