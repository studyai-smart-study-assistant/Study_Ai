import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly';

function nextScheduleISO(baseISO: string, recurrence: Recurrence, step: number): string {
  const base = new Date(baseISO);
  const date = new Date(base);
  if (recurrence === 'daily') date.setUTCDate(base.getUTCDate() + step);
  if (recurrence === 'weekly') date.setUTCDate(base.getUTCDate() + (7 * step));
  if (recurrence === 'monthly') date.setUTCMonth(base.getUTCMonth() + step);
  return date.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const sbUrl = Deno.env.get('SUPABASE_URL')!;
    const sbKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    const userClient = createClient(sbUrl, sbKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const action = body.action || 'send';

    if (action === 'send') {
      if (!oneSignalAppId || !oneSignalRestKey) throw new Error('OneSignal secrets missing');

      const { user_id, title, message, scheduled_time, recurrence = 'once', schedule_count, task_name, timezone = 'Asia/Kolkata' } = body;
      if (!user_id || !title || !message) throw new Error('user_id, title, message required');
      if (user.id !== user_id) throw new Error('Forbidden: only self notifications allowed');

      const safeRecurrence: Recurrence = ['once', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : 'once';
      const count = Math.min(Math.max(Number(schedule_count ?? (safeRecurrence === 'once' ? 1 : safeRecurrence === 'daily' ? 7 : 4)), 1), 31);
      const baseSchedule = scheduled_time || new Date().toISOString();

      const notifications = [];
      for (let step = 0; step < count; step++) {
        const sendAfter = safeRecurrence === 'once' && step > 0 ? null : nextScheduleISO(baseSchedule, safeRecurrence, step);
        const payload: Record<string, unknown> = {
          app_id: oneSignalAppId,
          include_aliases: { external_id: [user_id] },
          target_channel: 'push',
          headings: { en: title, hi: title },
          contents: { en: message, hi: message },
          data: { task_name: task_name || null, recurrence: safeRecurrence, timezone },
        };
        if (sendAfter) payload.send_after = sendAfter;

        const response = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: { Authorization: `Key ${oneSignalRestKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`OneSignal error ${response.status}: ${JSON.stringify(data)}`);
        notifications.push({ id: data.id, send_after: sendAfter });
        if (safeRecurrence === 'once') break;
      }

      return new Response(JSON.stringify({ success: true, action, notifications }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ping') {
      return new Response(JSON.stringify({ success: true, action, message: 'notification function is live' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
