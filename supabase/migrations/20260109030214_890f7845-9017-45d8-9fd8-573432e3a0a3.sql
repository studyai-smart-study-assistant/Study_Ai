-- Update profiles table with more fields for user data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS user_category text,
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS referral_code text,
ADD COLUMN IF NOT EXISTS referred_by text,
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_idx ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Update user_points to link with auth.users via UUID
-- First, we need to update the user_id column type if it's text
-- We'll keep it as text for now for backward compatibility and use the Supabase auth.uid()

-- Update RLS policies for profiles to use auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_referral_code text;
BEGIN
  -- Generate unique referral code
  new_referral_code := 'REF' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));
  
  INSERT INTO public.profiles (user_id, email, display_name, provider, referral_code, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    new_referral_code,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = NOW();
    
  -- Also ensure user_points record exists
  INSERT INTO public.user_points (user_id, balance, xp, level, credits, created_at, updated_at)
  VALUES (NEW.id::text, 50, 50, 1, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for profiles for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Clean up old data - delete all existing data to start fresh
TRUNCATE public.profiles CASCADE;
TRUNCATE public.user_points CASCADE;
TRUNCATE public.points_transactions CASCADE;