
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_study_minutes integer DEFAULT 0,
  total_activities integer DEFAULT 0,
  quizzes_taken integer DEFAULT 0,
  average_accuracy numeric(5,2) DEFAULT 0,
  notes_created integer DEFAULT 0,
  chapters_read integer DEFAULT 0,
  interactive_sessions integer DEFAULT 0,
  top_subjects text[] DEFAULT '{}',
  strong_areas text[] DEFAULT '{}',
  weak_areas text[] DEFAULT '{}',
  daily_breakdown jsonb DEFAULT '[]',
  subject_breakdown jsonb DEFAULT '[]',
  overview_summary text DEFAULT '',
  engagement_score integer DEFAULT 0,
  consistency_score integer DEFAULT 0,
  report_type text NOT NULL DEFAULT 'weekly',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, week_start, report_type)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.weekly_reports
  FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can insert their own reports" ON public.weekly_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can update their own reports" ON public.weekly_reports
  FOR UPDATE TO authenticated
  USING (user_id = (auth.uid())::text)
  WITH CHECK (user_id = (auth.uid())::text);
