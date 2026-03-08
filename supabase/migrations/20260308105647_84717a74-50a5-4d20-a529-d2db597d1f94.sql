
CREATE TABLE public.user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  memory_key text NOT NULL,
  memory_value text NOT NULL,
  source text NOT NULL DEFAULT 'ai_detected',
  category text NOT NULL DEFAULT 'general',
  importance integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, memory_key)
);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON public.user_memories FOR SELECT USING (user_id = (auth.uid())::text);
CREATE POLICY "Users can insert own memories" ON public.user_memories FOR INSERT WITH CHECK (user_id = (auth.uid())::text);
CREATE POLICY "Users can update own memories" ON public.user_memories FOR UPDATE USING (user_id = (auth.uid())::text);
CREATE POLICY "Users can delete own memories" ON public.user_memories FOR DELETE USING (user_id = (auth.uid())::text);

CREATE TRIGGER handle_user_memories_updated_at BEFORE UPDATE ON public.user_memories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
