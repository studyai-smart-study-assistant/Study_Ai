import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

interface RequestPayload {
  action?: "search" | "videoDetails" | "relatedVideos";
  query?: string;
  pageToken?: string;
  maxResults?: number;
  videoId?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidQuery(query: string): boolean {
  return query.trim().length >= 2 && query.trim().length <= 120;
}

function isValidPageToken(pageToken?: string): boolean {
  if (!pageToken) return true;
  return /^[A-Za-z0-9_-]{1,128}$/.test(pageToken);
}

function isValidVideoId(videoId?: string): boolean {
  if (!videoId) return false;
  return /^[A-Za-z0-9_-]{11}$/.test(videoId);
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

async function hashValue(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const logUsage = async (status: "success" | "error", errorCode?: string, endpoint = "youtube-search") => {
    await serviceClient.from("api_key_usage").insert({
      service: "youtube",
      key_identifier: "YOUTUBE_API_KEY",
      endpoint,
      status,
      error_code: errorCode,
      response_time_ms: Date.now() - startedAt,
    });
  };

  try {
    if (!youtubeApiKey) {
      await logUsage("error", "missing_api_key", "youtube-search:config");
      return jsonResponse({ error: "YouTube service not configured" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const ipHash = await hashValue(getClientIp(req));
    const identity = userId ? `user:${userId}` : `ip:${ipHash}`;

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentCount, error: rateCountError } = await serviceClient
      .from("youtube_proxy_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("identifier", identity)
      .gte("created_at", windowStart);

    if (rateCountError) {
      console.error("Rate limit count error", rateCountError);
      await logUsage("error", "rate_limit_check_failed");
      return jsonResponse({ error: "Service unavailable" }, 503);
    }

    if ((recentCount ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      await logUsage("error", "rate_limited", "youtube-search:rate-limit");
      return jsonResponse({ error: "Too many requests" }, 429);
    }

    await serviceClient.from("youtube_proxy_rate_limits").insert({
      identifier: identity,
      user_id: userId,
      ip_hash: ipHash,
    });

    const body = (await req.json()) as RequestPayload;
    const action = body.action ?? "search";

    if (!["search", "videoDetails", "relatedVideos"].includes(action)) {
      await logUsage("error", "invalid_action");
      return jsonResponse({ error: "Invalid action" }, 400);
    }

    if (action === "search") {
      if (!body.query || !isValidQuery(body.query) || !isValidPageToken(body.pageToken)) {
        await logUsage("error", "invalid_input");
        return jsonResponse({ error: "Invalid query or pageToken" }, 400);
      }

      const maxResults = Math.min(Math.max(Number(body.maxResults ?? 20), 1), 50);

      const params = new URLSearchParams({
        part: "snippet",
        q: body.query.trim(),
        type: "video",
        maxResults: maxResults.toString(),
        order: "relevance",
        safeSearch: "strict",
        key: youtubeApiKey,
      });

      if (body.pageToken) params.set("pageToken", body.pageToken);

      const response = await fetch(`${YOUTUBE_BASE_URL}/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        const reason = data?.error?.errors?.[0]?.reason;
        const code = reason === "quotaExceeded" ? "quota_exhausted" : `${response.status}`;
        await logUsage("error", code);
        return jsonResponse({ error: "YouTube API error", status: response.status, details: data?.error }, response.status);
      }

      await logUsage("success");
      return jsonResponse(data);
    }

    if (!isValidVideoId(body.videoId)) {
      await logUsage("error", "invalid_video_id");
      return jsonResponse({ error: "Invalid videoId" }, 400);
    }

    if (action === "videoDetails") {
      const params = new URLSearchParams({
        part: "snippet,statistics",
        id: body.videoId!,
        key: youtubeApiKey,
      });

      const response = await fetch(`${YOUTUBE_BASE_URL}/videos?${params}`);
      const data = await response.json();

      if (!response.ok) {
        const reason = data?.error?.errors?.[0]?.reason;
        const code = reason === "quotaExceeded" ? "quota_exhausted" : `${response.status}`;
        await logUsage("error", code);
        return jsonResponse({ error: "YouTube API error", status: response.status, details: data?.error }, response.status);
      }

      await logUsage("success");
      return jsonResponse(data);
    }

    const detailsParams = new URLSearchParams({
      part: "snippet,statistics",
      id: body.videoId!,
      key: youtubeApiKey,
    });

    const detailsResponse = await fetch(`${YOUTUBE_BASE_URL}/videos?${detailsParams}`);
    const detailsData = await detailsResponse.json();

    if (!detailsResponse.ok || !detailsData?.items?.[0]?.snippet?.channelId) {
      const reason = detailsData?.error?.errors?.[0]?.reason;
      const code = reason === "quotaExceeded" ? "quota_exhausted" : `${detailsResponse.status}`;
      await logUsage("error", code, "youtube-search:related-details");
      return jsonResponse({ items: [] });
    }

    const channelId = detailsData.items[0].snippet.channelId;

    const searchParams = new URLSearchParams({
      part: "snippet",
      channelId,
      type: "video",
      maxResults: "10",
      order: "relevance",
      key: youtubeApiKey,
    });

    const relatedResponse = await fetch(`${YOUTUBE_BASE_URL}/search?${searchParams}`);
    const relatedData = await relatedResponse.json();

    if (!relatedResponse.ok) {
      const reason = relatedData?.error?.errors?.[0]?.reason;
      const code = reason === "quotaExceeded" ? "quota_exhausted" : `${relatedResponse.status}`;
      await logUsage("error", code, "youtube-search:related-videos");
      return jsonResponse({ items: [] });
    }

    await logUsage("success");
    return jsonResponse({ items: relatedData.items ?? [] });
  } catch (error) {
    console.error("youtube-search function error", error);
    await logUsage("error", "unexpected_error");
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
