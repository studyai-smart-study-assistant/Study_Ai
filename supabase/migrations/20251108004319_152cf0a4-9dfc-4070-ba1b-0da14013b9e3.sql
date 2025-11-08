-- Add XP (Experience Points) tracking for leaderboard
-- XP is permanent and used for rankings, while points can be spent

ALTER TABLE user_points ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

-- Add index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_points_xp ON user_points(xp DESC);

COMMENT ON COLUMN user_points.xp IS 'Experience points for leaderboard ranking (permanent, never decreases)';
COMMENT ON COLUMN user_points.balance IS 'Spendable points that can be used for features';