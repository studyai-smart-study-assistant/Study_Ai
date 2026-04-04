import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function attachExternalId(currentUserId: string, appId: string, restKey: string) {
  const response = await fetch(`https://api.onesignal.com/apps/${appId}/users/by/external_id/${encodeURIComponent(currentUserId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Key ${restKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { tags: { supabase_user_id: currentUserId } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upsert OneSignal user: ${response.status} ${text}`);
  }
}

async function removeLegacyExternalId(legacyExternalId: string, appId: string, restKey: string) {
  const response = await fetch(`https://api.onesignal.com/apps/${appId}/users/by/external_id/${encodeURIComponent(legacyExternalId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Key ${restKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Failed to remove legacy OneSignal ID (${legacyExternalId}): ${response.status} ${text}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const sbUrl = Deno.env.get('SUPABASE_URL')!;
    const sbKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!oneSignalAppId || !oneSignalRestKey) {
      throw new Error('OneSignal is not configured in Supabase secrets.');
    }

    const userClient = createClient(sbUrl, sbKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { current_user_id, legacy_external_ids = [] } = await req.json();
    if (!current_user_id || current_user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'current_user_id must match authenticated user.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await attachExternalId(current_user_id, oneSignalAppId, oneSignalRestKey);

    const uniqueLegacyIds = [...new Set((legacy_external_ids || []).filter((id: string) => id && id !== current_user_id))];
    for (const legacyId of uniqueLegacyIds) {
      try {
        await removeLegacyExternalId(legacyId, oneSignalAppId, oneSignalRestKey);
      } catch (err) {
        console.warn('Legacy delete skipped:', err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      migrated_legacy_ids: uniqueLegacyIds.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
