-- Store author role separately from sender identity so sender_id remains auth user id.
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS author_role text;

ALTER TABLE public.chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_author_role_check;

ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_author_role_check
CHECK (author_role IN ('user', 'bot'));

-- Backfill author role from legacy values.
UPDATE public.chat_messages
SET author_role = CASE
  WHEN message_type = 'bot' THEN 'bot'
  ELSE 'user'
END
WHERE author_role IS NULL;

ALTER TABLE public.chat_messages
ALTER COLUMN author_role SET DEFAULT 'user';

ALTER TABLE public.chat_messages
ALTER COLUMN author_role SET NOT NULL;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Replace sender_id-only policies with conversation ownership policies.
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Senders can delete their messages" ON public.chat_messages;

CREATE POLICY "Conversation owners can view chat messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::text = chat_messages.chat_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation owners can insert chat messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::text = chat_messages.chat_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation owners can update chat messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::text = chat_messages.chat_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::text = chat_messages.chat_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation owners can delete chat messages"
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id::text = chat_messages.chat_id
        AND c.user_id = auth.uid()
    )
  );
