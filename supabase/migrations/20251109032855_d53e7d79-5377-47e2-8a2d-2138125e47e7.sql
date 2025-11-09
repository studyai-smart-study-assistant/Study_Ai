-- Add credits column to user_points table
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Update existing users to have 100 free credits if they have 0
UPDATE public.user_points 
SET credits = 100 
WHERE credits = 0;

COMMENT ON COLUMN public.user_points.credits IS 'Credits used for feature usage. Separate from points which are used for leaderboard ranking.';