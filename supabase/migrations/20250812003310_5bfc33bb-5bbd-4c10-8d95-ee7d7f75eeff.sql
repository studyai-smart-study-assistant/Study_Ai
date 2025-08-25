-- Fix profile avatar flow for Firebase-auth apps
-- 1) Align profiles.user_id with Firebase UID (text instead of uuid)
-- 2) Adjust RLS policies to compare auth.uid()::text when applicable

-- Alter column type (safe cast from uuid -> text)
ALTER TABLE public.profiles
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Make sure RLS stays enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies for INSERT/UPDATE/DELETE using text comparison
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid()::text = user_id);

-- Keep the open SELECT policy as-is (already permissive: USING (true))
