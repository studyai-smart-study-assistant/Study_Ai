-- Drop the existing check constraint
ALTER TABLE public.points_transactions 
DROP CONSTRAINT IF EXISTS points_transactions_transaction_type_check;

-- Add new check constraint with all required transaction types
ALTER TABLE public.points_transactions 
ADD CONSTRAINT points_transactions_transaction_type_check 
CHECK (transaction_type IN (
  'credit', 
  'deduction', 
  'bonus', 
  'referral', 
  'login', 
  'achievement',
  'task',
  'activity',
  'streak',
  'goal',
  'quiz'
));