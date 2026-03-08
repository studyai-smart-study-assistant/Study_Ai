-- Mind Vault storage for per-user private memories
CREATE TABLE IF NOT EXISTS public.user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  memory_key text NOT NULL,
  memory_value text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  importance integer NOT NULL DEFAULT 5,
  source text NOT NULL DEFAULT 'ai_detected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure dedup/upsert works per user+memory key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_memories_user_id_memory_key_key'
  ) THEN
    ALTER TABLE public.user_memories
      ADD CONSTRAINT user_memories_user_id_memory_key_key UNIQUE (user_id, memory_key);
  END IF;
END $$;

-- Helpful index for fast per-user retrieval
CREATE INDEX IF NOT EXISTS idx_user_memories_user_importance
  ON public.user_memories (user_id, importance DESC, updated_at DESC);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- Private per-user access only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_memories' AND policyname = 'Users can view own memories'
  ) THEN
    CREATE POLICY "Users can view own memories"
      ON public.user_memories
      FOR SELECT
      USING (user_id = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_memories' AND policyname = 'Users can insert own memories'
  ) THEN
    CREATE POLICY "Users can insert own memories"
      ON public.user_memories
      FOR INSERT
      WITH CHECK (user_id = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_memories' AND policyname = 'Users can update own memories'
  ) THEN
    CREATE POLICY "Users can update own memories"
      ON public.user_memories
      FOR UPDATE
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_memories' AND policyname = 'Users can delete own memories'
  ) THEN
    CREATE POLICY "Users can delete own memories"
      ON public.user_memories
      FOR DELETE
      USING (user_id = auth.uid()::text);
  END IF;
END $$;

-- Keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_memories_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_memories_updated_at
      BEFORE UPDATE ON public.user_memories
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;