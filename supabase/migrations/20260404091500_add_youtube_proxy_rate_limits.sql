CREATE TABLE IF NOT EXISTS public.youtube_proxy_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  user_id uuid,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_proxy_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage youtube proxy limits"
ON public.youtube_proxy_rate_limits
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_youtube_proxy_rate_limits_identifier_created_at
ON public.youtube_proxy_rate_limits (identifier, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_youtube_proxy_rate_limits_created_at
ON public.youtube_proxy_rate_limits (created_at DESC);
