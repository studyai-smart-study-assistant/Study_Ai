-- Ensure each conversation belongs to a single authenticated user.
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill from participants table when legacy records exist.
UPDATE public.conversations c
SET user_id = cp.user_id::uuid
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, user_id
  FROM public.conversation_participants
  WHERE user_id IS NOT NULL
  ORDER BY conversation_id, joined_at ASC
) cp
WHERE c.id = cp.conversation_id
  AND c.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_user_id_created_at
  ON public.conversations (user_id, created_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
CREATE POLICY "Users can create their own conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
CREATE POLICY "Users can delete their own conversations"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
