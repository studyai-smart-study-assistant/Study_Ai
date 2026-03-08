-- Tighten user_memories policies to authenticated users only
DROP POLICY IF EXISTS "Users can view own memories" ON public.user_memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON public.user_memories;
DROP POLICY IF EXISTS "Users can update own memories" ON public.user_memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON public.user_memories;

CREATE POLICY "Users can view own memories"
ON public.user_memories
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own memories"
ON public.user_memories
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own memories"
ON public.user_memories
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own memories"
ON public.user_memories
FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);