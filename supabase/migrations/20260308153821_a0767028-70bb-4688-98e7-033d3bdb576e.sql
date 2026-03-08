
-- Enable realtime for campus_messages and campus_chats
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_chats;

-- Drop restrictive INSERT policy and recreate as permissive for campus_messages
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.campus_messages;
CREATE POLICY "Users can send messages in their chats"
ON public.campus_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (sender_uid = (auth.uid())::text) AND 
  (EXISTS (
    SELECT 1 FROM campus_chats
    WHERE campus_chats.id = campus_messages.chat_id 
    AND (campus_chats.participant1_uid = (auth.uid())::text OR campus_chats.participant2_uid = (auth.uid())::text)
  ))
);

-- Drop restrictive SELECT policy and recreate as permissive for campus_messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.campus_messages;
CREATE POLICY "Users can view messages in their chats"
ON public.campus_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campus_chats
    WHERE campus_chats.id = campus_messages.chat_id 
    AND (campus_chats.participant1_uid = (auth.uid())::text OR campus_chats.participant2_uid = (auth.uid())::text)
  )
);

-- Drop restrictive policies on campus_chats and recreate as permissive
DROP POLICY IF EXISTS "Users can create chats" ON public.campus_chats;
CREATE POLICY "Users can create chats"
ON public.campus_chats
FOR INSERT
TO authenticated
WITH CHECK ((participant1_uid = (auth.uid())::text) OR (participant2_uid = (auth.uid())::text));

DROP POLICY IF EXISTS "Users can view their own chats" ON public.campus_chats;
CREATE POLICY "Users can view their own chats"
ON public.campus_chats
FOR SELECT
TO authenticated
USING ((participant1_uid = (auth.uid())::text) OR (participant2_uid = (auth.uid())::text));

DROP POLICY IF EXISTS "Users can update their own chats" ON public.campus_chats;
CREATE POLICY "Users can update their own chats"
ON public.campus_chats
FOR UPDATE
TO authenticated
USING ((participant1_uid = (auth.uid())::text) OR (participant2_uid = (auth.uid())::text));
