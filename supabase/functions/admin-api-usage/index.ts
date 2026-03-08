import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Check admin role using service client
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) throw new Error('Forbidden: Admin access required');

    const { action = 'stats', days = 7 } = await req.json().catch(() => ({ action: 'stats', days: 7 }));

    if (action === 'stats') {
      // Get usage stats grouped by service and status
      const { data: usageByService } = await adminClient
        .from('api_key_usage')
        .select('service, status, key_identifier, created_at, response_time_ms, error_code')
        .gte('created_at', new Date(Date.now() - days * 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      const logs = usageByService || [];

      // Aggregate stats
      const serviceStats: Record<string, { total: number; success: number; errors: number; rateLimits: number; avgResponseTime: number; keys: Record<string, number> }> = {};

      for (const log of logs) {
        if (!serviceStats[log.service]) {
          serviceStats[log.service] = { total: 0, success: 0, errors: 0, rateLimits: 0, avgResponseTime: 0, keys: {} };
        }
        const s = serviceStats[log.service];
        s.total++;
        if (log.status === 'success') s.success++;
        else if (log.error_code === '429' || log.error_code === '403') s.rateLimits++;
        else s.errors++;
        if (log.response_time_ms) s.avgResponseTime += log.response_time_ms;
        s.keys[log.key_identifier] = (s.keys[log.key_identifier] || 0) + 1;
      }

      // Calculate averages
      for (const s of Object.values(serviceStats)) {
        if (s.total > 0) s.avgResponseTime = Math.round(s.avgResponseTime / s.total);
      }

      // Get hourly distribution for chart
      const hourlyData: Record<string, number> = {};
      for (const log of logs) {
        const hour = log.created_at.substring(0, 13); // YYYY-MM-DDTHH
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      }

      return new Response(JSON.stringify({
        serviceStats,
        hourlyData,
        totalLogs: logs.length,
        recentLogs: logs.slice(0, 50),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
