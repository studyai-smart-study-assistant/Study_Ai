
-- Add display_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing profiles with a default display name based on user_id
UPDATE public.profiles 
SET display_name = 'User_' || LEFT(user_id, 8)
WHERE display_name IS NULL OR display_name = '';
