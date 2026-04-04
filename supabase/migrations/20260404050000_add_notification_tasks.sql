CREATE TABLE IF NOT EXISTS public.notification_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  task_name text NOT NULL,
  task_message text NOT NULL,
  recurrence text NOT NULL DEFAULT 'daily',
  scheduled_time timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_name)
);

CREATE TABLE IF NOT EXISTS public.study_nudge_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  nudge_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, nudge_date)
);

CREATE INDEX IF NOT EXISTS idx_notification_tasks_user_active ON public.notification_tasks(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_tasks_user_schedule ON public.notification_tasks(user_id, scheduled_time DESC);

ALTER TABLE public.notification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_nudge_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification tasks"
ON public.notification_tasks FOR SELECT TO authenticated
USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can manage own notification tasks"
ON public.notification_tasks FOR ALL TO authenticated
USING (user_id = (auth.uid())::text)
WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can view own study nudges"
ON public.study_nudge_logs FOR SELECT TO authenticated
USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can insert own study nudges"
ON public.study_nudge_logs FOR INSERT TO authenticated
WITH CHECK (user_id = (auth.uid())::text);

CREATE OR REPLACE FUNCTION public.touch_notification_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_tasks_updated_at ON public.notification_tasks;
CREATE TRIGGER trg_notification_tasks_updated_at
BEFORE UPDATE ON public.notification_tasks
FOR EACH ROW
EXECUTE FUNCTION public.touch_notification_tasks_updated_at();
