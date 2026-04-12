-- Private per-user storage for cloud-synced app data (chat history etc.)
CREATE TABLE IF NOT EXISTS public.user_private_data (
  user_id text PRIMARY KEY,
  chat_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own private data" ON public.user_private_data;
CREATE POLICY "Users can read own private data"
ON public.user_private_data
FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own private data" ON public.user_private_data;
CREATE POLICY "Users can insert own private data"
ON public.user_private_data
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own private data" ON public.user_private_data;
CREATE POLICY "Users can update own private data"
ON public.user_private_data
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own private data" ON public.user_private_data;
CREATE POLICY "Users can delete own private data"
ON public.user_private_data
FOR DELETE
USING (auth.uid()::text = user_id);

CREATE OR REPLACE FUNCTION public.set_user_private_data_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_private_data_updated_at ON public.user_private_data;
CREATE TRIGGER trg_user_private_data_updated_at
BEFORE UPDATE ON public.user_private_data
FOR EACH ROW
EXECUTE FUNCTION public.set_user_private_data_updated_at();
