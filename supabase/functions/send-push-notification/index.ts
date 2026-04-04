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

async function sendOneSignalPush(payload: Record<string, unknown>, restKey: string): Promise<any> {
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${restKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OneSignal error ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const sbUrl = Deno.env.get('SUPABASE_URL')!;
    const sbKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalRestKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!oneSignalAppId || !oneSignalRestKey) {
      throw new Error('OneSignal is not configured. Set ONESIGNAL_APP_ID + ONESIGNAL_REST_API_KEY in Supabase secrets.');
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

    const {
      user_id,
      title,
      message,
      scheduled_time,
      recurrence = 'once',
      schedule_count,
      task_name,
      timezone = 'Asia/Kolkata',
    } = await req.json();

    if (!user_id || !title || !message) {
      return new Response(JSON.stringify({ error: 'user_id, title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user.id !== user_id) {
      return new Response(JSON.stringify({ error: 'You can send notifications only to your own user_id.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeRecurrence: Recurrence = ['once', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : 'once';
    const count = Math.min(
      Math.max(Number(schedule_count ?? (safeRecurrence === 'once' ? 1 : safeRecurrence === 'daily' ? 7 : 4)), 1),
      31,
    );

    const baseSchedule = scheduled_time || new Date().toISOString();

    const results = [];
    for (let step = 0; step < count; step++) {
      const sendAt = safeRecurrence === 'once' && step > 0 ? null : nextScheduleISO(baseSchedule, safeRecurrence, step);

      const payload: Record<string, unknown> = {
        app_id: oneSignalAppId,
        include_aliases: { external_id: [user_id] },
        target_channel: 'push',
        headings: { en: title, hi: title },
        contents: { en: message, hi: message },
        data: {
          task_name: task_name || null,
          recurrence: safeRecurrence,
          timezone,
        },
      };

      if (sendAt) payload.send_after = sendAt;
      const data = await sendOneSignalPush(payload, oneSignalRestKey);
      results.push({ id: data.id, send_after: sendAt });

      if (safeRecurrence === 'once') break;
    }

    return new Response(JSON.stringify({ success: true, notifications: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
