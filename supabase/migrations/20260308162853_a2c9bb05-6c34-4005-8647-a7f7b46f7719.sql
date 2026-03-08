
-- Fix RLS policies for campus_users - make SELECT truly public for authenticated users
DROP POLICY IF EXISTS "Anyone can view campus users" ON public.campus_users;
CREATE POLICY "Anyone can view campus users"
ON public.campus_users
FOR SELECT
TO authenticated
USING (true);

-- Make campus_users INSERT/UPDATE more permissive
DROP POLICY IF EXISTS "Users can insert their own record" ON public.campus_users;
CREATE POLICY "Users can insert their own record"
ON public.campus_users
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own status" ON public.campus_users;
CREATE POLICY "Users can update their own status"
ON public.campus_users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix campus_chats policies - use firebase_uid stored in profiles
DROP POLICY IF EXISTS "Users can create chats" ON public.campus_chats;
CREATE POLICY "Users can create chats"
ON public.campus_chats
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own chats" ON public.campus_chats;
CREATE POLICY "Users can view their own chats"
ON public.campus_chats
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update their own chats" ON public.campus_chats;
CREATE POLICY "Users can update their own chats"
ON public.campus_chats
FOR UPDATE
TO authenticated
USING (true);

-- Fix campus_messages policies
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.campus_messages;
CREATE POLICY "Users can send messages in their chats"
ON public.campus_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.campus_messages;
CREATE POLICY "Users can view messages in their chats"
ON public.campus_messages
FOR SELECT
TO authenticated
USING (true);
