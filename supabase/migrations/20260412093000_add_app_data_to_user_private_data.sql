ALTER TABLE public.user_private_data
ADD COLUMN IF NOT EXISTS app_data jsonb NOT NULL DEFAULT '{}'::jsonb;
