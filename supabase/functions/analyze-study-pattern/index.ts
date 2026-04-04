import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function getHourKey(date: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hour12: false }).format(date));
}

function buildPreferredSchedule(hour: number, timeZone: string): string {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone }));
  local.setHours(hour, 0, 0, 0);
  if (local <= new Date(now.toLocaleString('en-US', { timeZone }))) {
    local.setDate(local.getDate() + 1);
  }
  return local.toISOString();
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

    const { timezone = 'Asia/Kolkata', auto_schedule = true } = await req.json().catch(() => ({}));

    const since = new Date();
    since.setDate(since.getDate() - 14);

    const { data: messages, error } = await userClient
      .from('chat_messages')
      .select('created_at')
      .eq('sender_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;

    const hourMap = new Map<number, number>();
    const dateSet = new Set<string>();

    for (const m of messages || []) {
      const dt = new Date(m.created_at);
      const hour = getHourKey(dt, timezone);
      const day = getDateKey(dt, timezone);
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      dateSet.add(day);
    }

    let preferredHour = 19;
    let maxCount = -1;
    for (const [hour, count] of hourMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        preferredHour = hour;
      }
    }

    const now = new Date();
    const todayKey = getDateKey(now, timezone);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday, timezone);
    const dayBefore = new Date(now);
    dayBefore.setDate(dayBefore.getDate() - 2);
    const dayBeforeKey = getDateKey(dayBefore, timezone);

    const studiedToday = dateSet.has(todayKey);
    const consistentLast2Days = dateSet.has(yesterdayKey) && dateSet.has(dayBeforeKey);

    let nudgeSent = false;
    if (!studiedToday && consistentLast2Days && oneSignalAppId && oneSignalRestKey) {
      const { data: existingNudge } = await userClient
        .from('study_nudge_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('nudge_date', todayKey)
        .maybeSingle();

      if (!existingNudge) {
        const payload = {
          app_id: oneSignalAppId,
          include_aliases: { external_id: [user.id] },
          target_channel: 'push',
          headings: { en: 'Study Reminder 📚', hi: 'Study Reminder 📚' },
          contents: {
            en: 'Kya haal hai champion? Aaj study start nahi hui lagti — chalo 20 min ka quick session karein! 🚀',
            hi: 'क्या हाल है चैंपियन? आज स्टडी स्टार्ट नहीं हुई लगती — चलो 20 मिनट का quick session करें! 🚀',
          },
        };

        await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: {
            Authorization: `Key ${oneSignalRestKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        await userClient.from('study_nudge_logs').insert({ user_id: user.id, nudge_date: todayKey });
        nudgeSent = true;
      }
    }

    const suggestedSchedule = buildPreferredSchedule(preferredHour, timezone);

    if (auto_schedule) {
      await userClient.from('notification_tasks').upsert({
        user_id: user.id,
        task_name: 'Auto Daily Study Reminder',
        task_message: 'Aapka best study time aa gaya hai — 30 min focus mode start karein? 🎯',
        recurrence: 'daily',
        scheduled_time: suggestedSchedule,
        timezone,
        is_active: true,
        metadata: { auto_generated: true },
      }, { onConflict: 'user_id,task_name' as any });
    }

    return new Response(JSON.stringify({
      success: true,
      preferred_hour: preferredHour,
      suggested_schedule: suggestedSchedule,
      studied_today: studiedToday,
      nudge_sent: nudgeSent,
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
