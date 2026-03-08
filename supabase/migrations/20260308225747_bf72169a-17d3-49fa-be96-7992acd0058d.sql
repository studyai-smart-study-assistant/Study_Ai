
CREATE TABLE public.ad_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_network text NOT NULL,
  page text NOT NULL DEFAULT 'global',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ad_network, page)
);

ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ad settings (needed for frontend to check)
CREATE POLICY "Anyone can read ad settings"
  ON public.ad_settings FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert ad settings"
  ON public.ad_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role((auth.uid())::text, 'admin'::app_role));

CREATE POLICY "Admins can update ad settings"
  ON public.ad_settings FOR UPDATE
  TO authenticated
  USING (has_role((auth.uid())::text, 'admin'::app_role))
  WITH CHECK (has_role((auth.uid())::text, 'admin'::app_role));

CREATE POLICY "Admins can delete ad settings"
  ON public.ad_settings FOR DELETE
  TO authenticated
  USING (has_role((auth.uid())::text, 'admin'::app_role));

-- Insert default settings
INSERT INTO public.ad_settings (ad_network, page, enabled) VALUES
  ('adsterra', 'global', false),
  ('monetag', 'global', false),
  ('adsterra', 'home', false),
  ('adsterra', 'profile', false),
  ('adsterra', 'notes', false),
  ('adsterra', 'quiz', false),
  ('adsterra', 'library', false),
  ('adsterra', 'teacher', false),
  ('monetag', 'home', false),
  ('monetag', 'profile', false),
  ('monetag', 'notes', false),
  ('monetag', 'quiz', false),
  ('monetag', 'library', false),
  ('monetag', 'teacher', false);
