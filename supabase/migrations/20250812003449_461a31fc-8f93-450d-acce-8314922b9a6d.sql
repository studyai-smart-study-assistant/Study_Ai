-- Reorder operations: drop dependent policies first, then alter type, then recreate policies

-- Drop policies that reference user_id (to allow altering column type)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Now alter column type from uuid -> text
ALTER TABLE public.profiles
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Ensure RLS remains enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies with text comparison
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

-- SELECT policy is already permissive and unchanged