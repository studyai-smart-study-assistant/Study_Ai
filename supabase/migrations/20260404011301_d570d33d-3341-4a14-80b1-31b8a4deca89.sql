
-- Create study_groups table
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Study Group',
  invite_code TEXT NOT NULL UNIQUE,
  creator_id TEXT NOT NULL,
  group_system_prompt TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_participants table
CREATE TABLE public.group_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_chat_messages table
CREATE TABLE public.group_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_groups
CREATE POLICY "Anyone can view groups" ON public.study_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (creator_id = (auth.uid())::text);
CREATE POLICY "Creator can update group" ON public.study_groups FOR UPDATE TO authenticated USING (creator_id = (auth.uid())::text);

-- RLS policies for group_participants
CREATE POLICY "Members can view participants" ON public.group_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can join groups" ON public.group_participants FOR INSERT TO authenticated WITH CHECK (user_id = (auth.uid())::text);
CREATE POLICY "Users can leave groups" ON public.group_participants FOR UPDATE TO authenticated USING (user_id = (auth.uid())::text);
CREATE POLICY "Users can delete own membership" ON public.group_participants FOR DELETE TO authenticated USING (user_id = (auth.uid())::text);

-- RLS policies for group_chat_messages
CREATE POLICY "Group members can view messages" ON public.group_chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_participants WHERE group_id = group_chat_messages.group_id AND user_id = (auth.uid())::text AND is_active = true)
);
CREATE POLICY "Group members can send messages" ON public.group_chat_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = (auth.uid())::text AND
  EXISTS (SELECT 1 FROM public.group_participants WHERE group_id = group_chat_messages.group_id AND user_id = (auth.uid())::text AND is_active = true)
);

-- Enable realtime for group chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_participants;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.study_groups WHERE invite_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- RPC: create_study_group
CREATE OR REPLACE FUNCTION public.create_study_group(p_group_name TEXT, p_group_system_prompt TEXT DEFAULT '')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_group_id UUID;
  new_code TEXT;
  user_id_text TEXT;
BEGIN
  user_id_text := (auth.uid())::text;
  new_code := generate_invite_code();
  
  INSERT INTO study_groups (name, invite_code, creator_id, group_system_prompt)
  VALUES (p_group_name, new_code, user_id_text, p_group_system_prompt)
  RETURNING id INTO new_group_id;
  
  INSERT INTO group_participants (group_id, user_id, role)
  VALUES (new_group_id, user_id_text, 'admin');
  
  RETURN json_build_object('id', new_group_id, 'name', p_group_name, 'invite_code', new_code, 'creator_id', user_id_text, 'group_system_prompt', p_group_system_prompt);
END;
$$;

-- RPC: join_study_group_by_code
CREATE OR REPLACE FUNCTION public.join_study_group_by_code(p_invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_group study_groups%ROWTYPE;
  member_count INT;
  user_id_text TEXT;
BEGIN
  user_id_text := (auth.uid())::text;
  
  SELECT * INTO found_group FROM study_groups WHERE invite_code = UPPER(p_invite_code);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  
  SELECT COUNT(*) INTO member_count FROM group_participants WHERE group_id = found_group.id AND is_active = true;
  IF member_count >= 50 THEN
    RAISE EXCEPTION 'Group member limit reached';
  END IF;
  
  INSERT INTO group_participants (group_id, user_id, role)
  VALUES (found_group.id, user_id_text, 'member')
  ON CONFLICT (group_id, user_id) DO UPDATE SET is_active = true;
  
  RETURN json_build_object('id', found_group.id, 'name', found_group.name, 'invite_code', found_group.invite_code, 'creator_id', found_group.creator_id, 'group_system_prompt', found_group.group_system_prompt);
END;
$$;
