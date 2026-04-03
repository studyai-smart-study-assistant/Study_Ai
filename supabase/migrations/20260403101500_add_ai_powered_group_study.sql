-- AI-Powered Group Study: schema, RLS, and realtime setup

CREATE TABLE IF NOT EXISTS public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Study Group',
  invite_code text NOT NULL UNIQUE,
  creator_id text NOT NULL,
  group_system_prompt text NOT NULL DEFAULT 'तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के Mind Vault का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक personalized classroom feel आए।',
  max_members integer NOT NULL DEFAULT 50 CHECK (max_members BETWEEN 2 AND 50),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_groups_invite_code_len CHECK (char_length(invite_code) BETWEEN 6 AND 8)
);

CREATE TABLE IF NOT EXISTS public.group_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  added_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.study_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_invite_code ON public.study_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON public.group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id ON public.group_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_messages_group_id ON public.study_group_messages(group_id);

CREATE OR REPLACE FUNCTION public.update_study_groups_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_study_groups_updated_at ON public.study_groups;
CREATE TRIGGER trg_study_groups_updated_at
BEFORE UPDATE ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_study_groups_updated_at();

CREATE OR REPLACE FUNCTION public.generate_study_group_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate text;
  is_taken boolean;
BEGIN
  LOOP
    candidate :=
      substr(letters, floor(random() * length(letters) + 1)::int, 1) ||
      substr(letters, floor(random() * length(letters) + 1)::int, 1) ||
      substr(letters, floor(random() * length(letters) + 1)::int, 1) ||
      substr(letters, floor(random() * length(letters) + 1)::int, 1) ||
      substr(letters, floor(random() * length(letters) + 1)::int, 1) ||
      lpad((floor(random() * 100))::int::text, 2, '0');

    SELECT EXISTS (SELECT 1 FROM public.study_groups WHERE invite_code = candidate) INTO is_taken;
    IF NOT is_taken THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their groups" ON public.study_groups;
CREATE POLICY "Members can view their groups"
ON public.study_groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_participants gp
    WHERE gp.group_id = study_groups.id
      AND gp.user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Authenticated can create groups" ON public.study_groups;
CREATE POLICY "Authenticated can create groups"
ON public.study_groups
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid()::text);

DROP POLICY IF EXISTS "Group owners can update groups" ON public.study_groups;
CREATE POLICY "Group owners can update groups"
ON public.study_groups
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid()::text)
WITH CHECK (creator_id = auth.uid()::text);

DROP POLICY IF EXISTS "Members can view participants" ON public.group_participants;
CREATE POLICY "Members can view participants"
ON public.group_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_participants self_gp
    WHERE self_gp.group_id = group_participants.group_id
      AND self_gp.user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Owners can add participants" ON public.group_participants;
CREATE POLICY "Owners can add participants"
ON public.group_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.study_groups sg
    WHERE sg.id = group_participants.group_id
      AND sg.creator_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can leave group" ON public.group_participants;
CREATE POLICY "Users can leave group"
ON public.group_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Members can view group messages" ON public.study_group_messages;
CREATE POLICY "Members can view group messages"
ON public.study_group_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_participants gp
    WHERE gp.group_id = study_group_messages.group_id
      AND gp.user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Members can send group messages" ON public.study_group_messages;
CREATE POLICY "Members can send group messages"
ON public.study_group_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.group_participants gp
    WHERE gp.group_id = study_group_messages.group_id
      AND gp.user_id = auth.uid()::text
  )
);

CREATE OR REPLACE FUNCTION public.create_study_group(
  p_group_name text DEFAULT 'Study Group',
  p_group_system_prompt text DEFAULT NULL
)
RETURNS TABLE(group_id uuid, invite_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_group_id uuid;
  v_invite_code text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_invite_code := public.generate_study_group_invite_code();

  INSERT INTO public.study_groups (name, invite_code, creator_id, group_system_prompt)
  VALUES (
    COALESCE(NULLIF(trim(p_group_name), ''), 'Study Group'),
    v_invite_code,
    v_user_id,
    COALESCE(NULLIF(trim(p_group_system_prompt), ''), 'तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के Mind Vault का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक personalized classroom feel आए।')
  )
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_participants (group_id, user_id, role, added_by)
  VALUES (v_group_id, v_user_id, 'owner', v_user_id);

  RETURN QUERY SELECT v_group_id, v_invite_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_study_group(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_study_group_by_code(p_invite_code text)
RETURNS TABLE(group_id uuid, invite_code text, group_name text, member_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_group public.study_groups%ROWTYPE;
  v_member_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_group
  FROM public.study_groups
  WHERE invite_code = upper(trim(p_invite_code))
    AND is_active = true
  LIMIT 1;

  IF v_group.id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  SELECT count(*)::integer INTO v_member_count
  FROM public.group_participants
  WHERE group_id = v_group.id;

  IF EXISTS (
    SELECT 1
    FROM public.group_participants
    WHERE group_id = v_group.id
      AND user_id = v_user_id
  ) THEN
    RETURN QUERY SELECT v_group.id, v_group.invite_code, v_group.name, v_member_count;
    RETURN;
  END IF;

  IF v_member_count >= v_group.max_members THEN
    RAISE EXCEPTION 'GROUP_FULL';
  END IF;

  INSERT INTO public.group_participants (group_id, user_id, role, added_by)
  VALUES (v_group.id, v_user_id, 'member', v_user_id);

  SELECT count(*)::integer INTO v_member_count
  FROM public.group_participants
  WHERE group_id = v_group.id;

  RETURN QUERY SELECT v_group.id, v_group.invite_code, v_group.name, v_member_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_study_group_by_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_member_to_study_group(p_group_id uuid, p_member_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text := auth.uid()::text;
  v_group public.study_groups%ROWTYPE;
  v_member_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_group
  FROM public.study_groups
  WHERE id = p_group_id
    AND is_active = true
  LIMIT 1;

  IF v_group.id IS NULL THEN
    RAISE EXCEPTION 'GROUP_NOT_FOUND';
  END IF;

  IF v_group.creator_id <> v_user_id THEN
    RAISE EXCEPTION 'ONLY_OWNER_CAN_ADD';
  END IF;

  IF p_member_user_id IS NULL OR trim(p_member_user_id) = '' THEN
    RAISE EXCEPTION 'INVALID_MEMBER';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_participants
    WHERE group_id = p_group_id
      AND user_id = p_member_user_id
  ) THEN
    RETURN true;
  END IF;

  SELECT count(*)::integer INTO v_member_count
  FROM public.group_participants
  WHERE group_id = p_group_id;

  IF v_member_count >= v_group.max_members THEN
    RAISE EXCEPTION 'GROUP_FULL';
  END IF;

  INSERT INTO public.group_participants (group_id, user_id, role, added_by)
  VALUES (p_group_id, p_member_user_id, 'member', v_user_id);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_member_to_study_group(uuid, text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.study_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_messages;
