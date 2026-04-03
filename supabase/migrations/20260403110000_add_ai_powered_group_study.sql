-- AI-Powered Group Study foundation

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Study Group',
  invite_code varchar(8) not null unique,
  creator_id text not null,
  group_system_prompt text not null default 'तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के Mind Vault का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक Personalized Classroom वाली फील आए।',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id text not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique(group_id, user_id)
);

create table if not exists public.study_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  sender_id text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_study_groups_invite_code on public.study_groups(invite_code);
create index if not exists idx_group_participants_group on public.group_participants(group_id);
create index if not exists idx_group_participants_user on public.group_participants(user_id);
create index if not exists idx_study_group_messages_group_created on public.study_group_messages(group_id, created_at desc);

alter table public.study_groups enable row level security;
alter table public.group_participants enable row level security;
alter table public.study_group_messages enable row level security;

create or replace function public.is_study_group_member(p_group_id uuid, p_user_id text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.group_participants gp
    where gp.group_id = p_group_id
      and gp.user_id = p_user_id
      and gp.is_active = true
  );
$$;

create or replace function public.generate_study_invite_code()
returns varchar
language plpgsql
as $$
declare
  candidate varchar(8);
begin
  loop
    candidate := 'STUDY' || lpad((floor(random() * 100)::int)::text, 2, '0');
    exit when not exists (select 1 from public.study_groups where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.enforce_study_group_member_limit()
returns trigger
language plpgsql
as $$
declare
  members_count int;
begin
  select count(*) into members_count
  from public.group_participants
  where group_id = new.group_id and is_active = true;

  if members_count >= 50 then
    raise exception 'Group member limit reached (max 50 members).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_study_group_member_limit on public.group_participants;
create trigger trg_enforce_study_group_member_limit
before insert on public.group_participants
for each row execute function public.enforce_study_group_member_limit();

create or replace function public.create_study_group(
  p_group_name text default 'Study Group',
  p_group_system_prompt text default null
)
returns public.study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_group public.study_groups;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  insert into public.study_groups (name, invite_code, creator_id, group_system_prompt)
  values (
    coalesce(nullif(trim(p_group_name), ''), 'Study Group'),
    public.generate_study_invite_code(),
    v_user_id,
    coalesce(
      nullif(trim(p_group_system_prompt), ''),
      'तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के Mind Vault का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक Personalized Classroom वाली फील आए।'
    )
  )
  returning * into v_group;

  insert into public.group_participants(group_id, user_id, role)
  values (v_group.id, v_user_id, 'creator');

  return v_group;
end;
$$;

create or replace function public.join_study_group_by_code(p_invite_code text)
returns public.study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_group public.study_groups;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select * into v_group
  from public.study_groups
  where upper(invite_code) = upper(trim(p_invite_code));

  if not found then
    raise exception 'Invalid invite code. Please check and try again.';
  end if;

  insert into public.group_participants(group_id, user_id, role, is_active)
  values (v_group.id, v_user_id, 'member', true)
  on conflict (group_id, user_id)
  do update set is_active = true, joined_at = now();

  return v_group;
end;
$$;

grant execute on function public.create_study_group(text, text) to authenticated;
grant execute on function public.join_study_group_by_code(text) to authenticated;

drop policy if exists "Study group members can view groups" on public.study_groups;
create policy "Study group members can view groups"
on public.study_groups for select
to authenticated
using (public.is_study_group_member(id, auth.uid()::text));

drop policy if exists "Authenticated users can create study groups" on public.study_groups;
create policy "Authenticated users can create study groups"
on public.study_groups for insert
to authenticated
with check (creator_id = auth.uid()::text);

drop policy if exists "Group creators can update their groups" on public.study_groups;
create policy "Group creators can update their groups"
on public.study_groups for update
to authenticated
using (creator_id = auth.uid()::text)
with check (creator_id = auth.uid()::text);

drop policy if exists "Group members can view participants" on public.group_participants;
create policy "Group members can view participants"
on public.group_participants for select
to authenticated
using (public.is_study_group_member(group_id, auth.uid()::text));

drop policy if exists "Members can invite participants" on public.group_participants;
create policy "Members can invite participants"
on public.group_participants for insert
to authenticated
with check (
  public.is_study_group_member(group_id, auth.uid()::text)
  and (
    select count(*) from public.group_participants gp
    where gp.group_id = group_participants.group_id
      and gp.is_active = true
  ) < 50
);

drop policy if exists "Users can manage their participant status" on public.group_participants;
create policy "Users can manage their participant status"
on public.group_participants for update
to authenticated
using (
  user_id = auth.uid()::text
  or exists (
    select 1 from public.study_groups sg
    where sg.id = group_participants.group_id
      and sg.creator_id = auth.uid()::text
  )
)
with check (
  user_id = auth.uid()::text
  or exists (
    select 1 from public.study_groups sg
    where sg.id = group_participants.group_id
      and sg.creator_id = auth.uid()::text
  )
);

drop policy if exists "Group members can read messages" on public.study_group_messages;
create policy "Group members can read messages"
on public.study_group_messages for select
to authenticated
using (public.is_study_group_member(group_id, auth.uid()::text));

drop policy if exists "Group members can send messages" on public.study_group_messages;
create policy "Group members can send messages"
on public.study_group_messages for insert
to authenticated
with check (
  public.is_study_group_member(group_id, auth.uid()::text)
  and sender_id = auth.uid()::text
);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.study_groups;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.group_participants;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.study_group_messages;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
