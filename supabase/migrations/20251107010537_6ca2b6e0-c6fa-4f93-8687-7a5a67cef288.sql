-- Create user_points table to store user point balances securely
CREATE TABLE public.user_points (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Users can view their own points
CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
TO authenticated
USING (user_id = (auth.uid())::text);

-- Users can insert their own points record (for initial setup)
CREATE POLICY "Users can insert their own points"
ON public.user_points
FOR INSERT
TO authenticated
WITH CHECK (user_id = (auth.uid())::text);

-- Only allow updates through secured functions (no direct updates by users)
-- This prevents users from manipulating their balance directly

-- Create points_transactions table to log all point activities
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'deduction', 'bonus', 'referral', 'login', 'achievement')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on points_transactions
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transaction history
CREATE POLICY "Users can view their own transactions"
ON public.points_transactions
FOR SELECT
TO authenticated
USING (user_id = (auth.uid())::text);

-- Only edge functions can insert transactions (via service role)
-- No direct insert policy for users

-- Create index for faster queries
CREATE INDEX idx_points_transactions_user_created 
ON public.points_transactions(user_id, created_at DESC);

-- Create trigger to update updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();