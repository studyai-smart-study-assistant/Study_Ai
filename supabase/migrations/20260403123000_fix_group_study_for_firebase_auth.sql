-- Fix Group Study for Firebase-based auth flow (no Supabase auth session)

-- App uses Firebase UID stored in text columns, so Supabase auth.uid() can be null.
-- Make group tables accessible to current architecture and move identity checks into RPC params.

alter table if exists public.study_groups disable row level security;
alter table if exists public.group_participants disable row level security;
alter table if exists public.study_group_messages disable row level security;

drop policy if exists "Study group members can view groups" on public.study_groups;
drop policy if exists "Authenticated users can create study groups" on public.study_groups;
drop policy if exists "Group creators can update their groups" on public.study_groups;
drop policy if exists "Group members can view participants" on public.group_participants;
drop policy if exists "Members can invite participants" on public.group_participants;
drop policy if exists "Users can manage their participant status" on public.group_participants;
drop policy if exists "Group members can read messages" on public.study_group_messages;
drop policy if exists "Group members can send messages" on public.study_group_messages;

create or replace function public.create_study_group(
  p_creator_id text,
  p_group_name text default 'Study Group',
  p_group_system_prompt text default null
)
returns public.study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.study_groups;
begin
  if p_creator_id is null or trim(p_creator_id) = '' then
    raise exception 'creator_id is required.';
  end if;

  insert into public.study_groups (name, invite_code, creator_id, group_system_prompt)
  values (
    coalesce(nullif(trim(p_group_name), ''), 'Study Group'),
    public.generate_study_invite_code(),
    trim(p_creator_id),
    coalesce(
      nullif(trim(p_group_system_prompt), ''),
      'तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के Mind Vault का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक Personalized Classroom वाली फील आए।'
    )
  )
  returning * into v_group;

  insert into public.group_participants(group_id, user_id, role)
  values (v_group.id, trim(p_creator_id), 'creator')
  on conflict (group_id, user_id) do nothing;

  return v_group;
end;
$$;

create or replace function public.join_study_group_by_code(
  p_invite_code text,
  p_user_id text
)
returns public.study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.study_groups;
begin
  if p_user_id is null or trim(p_user_id) = '' then
    raise exception 'user_id is required.';
  end if;

  select * into v_group
  from public.study_groups
  where upper(invite_code) = upper(trim(p_invite_code));

  if not found then
    raise exception 'Invalid invite code. Please check and try again.';
  end if;

  insert into public.group_participants(group_id, user_id, role, is_active)
  values (v_group.id, trim(p_user_id), 'member', true)
  on conflict (group_id, user_id)
  do update set is_active = true, joined_at = now();

  return v_group;
end;
$$;

grant execute on function public.create_study_group(text, text, text) to anon, authenticated;
grant execute on function public.join_study_group_by_code(text, text) to anon, authenticated;
