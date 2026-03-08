
-- Campus Groups table
CREATE TABLE public.campus_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  only_admins_send boolean NOT NULL DEFAULT false,
  only_admins_add_members boolean NOT NULL DEFAULT false
);

-- Campus Group Members
CREATE TABLE public.campus_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.campus_groups(id) ON DELETE CASCADE,
  user_uid text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_uid)
);

-- Campus Group Messages
CREATE TABLE public.campus_group_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.campus_groups(id) ON DELETE CASCADE,
  sender_uid text NOT NULL,
  text_content text,
  image_url text,
  message_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  is_ai_response boolean NOT NULL DEFAULT false
);

-- RLS
ALTER TABLE public.campus_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_group_messages ENABLE ROW LEVEL SECURITY;

-- Policies for campus_groups
CREATE POLICY "Authenticated users can view groups" ON public.campus_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.campus_groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update groups" ON public.campus_groups FOR UPDATE TO authenticated USING (true);

-- Policies for campus_group_members
CREATE POLICY "Authenticated users can view group members" ON public.campus_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add group members" ON public.campus_group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can remove group members" ON public.campus_group_members FOR DELETE TO authenticated USING (true);

-- Policies for campus_group_messages
CREATE POLICY "Authenticated users can view group messages" ON public.campus_group_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can send group messages" ON public.campus_group_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_group_members;
