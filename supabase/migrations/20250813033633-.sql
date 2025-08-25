-- Reordered migration: tables first, then helper function, then policies and storage

-- 1) Storage bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('chat_media','chat_media', true)
on conflict (id) do nothing;

-- 2) Tables
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  created_by text not null
);

create table if not exists public.chat_participants (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id text not null,
  joined_at timestamptz not null default now(),
  unique (chat_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id text not null,
  message_type text not null default 'text',
  text_content text,
  image_path text,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_chat_time on public.chat_messages(chat_id, created_at);

-- 3) Enable RLS
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

-- 4) Helper function (after tables exist)
create or replace function public.is_chat_participant(_chat_id uuid, _user_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_participants
    where chat_id = _chat_id and user_id = _user_id
  );
$$;

-- 5) Policies: drop then create
-- chats
drop policy if exists "Chats viewable by participants" on public.chats;
drop policy if exists "Users can create chats they own" on public.chats;
drop policy if exists "Participants can update chats" on public.chats;

create policy "Chats viewable by participants"
  on public.chats for select
  using (public.is_chat_participant(id, auth.uid()::text));

create policy "Users can create chats they own"
  on public.chats for insert
  with check (created_by = auth.uid()::text);

create policy "Participants can update chats"
  on public.chats for update
  using (public.is_chat_participant(id, auth.uid()::text));

-- chat_participants
drop policy if exists "Participants can view participants" on public.chat_participants;
create policy "Participants can view participants"
  on public.chat_participants for select
  using (public.is_chat_participant(chat_id, auth.uid()::text));

-- chat_messages
drop policy if exists "Participants can read messages" on public.chat_messages;
drop policy if exists "Participants can send messages" on public.chat_messages;
drop policy if exists "Senders can delete their messages" on public.chat_messages;

create policy "Participants can read messages"
  on public.chat_messages for select
  using (public.is_chat_participant(chat_id, auth.uid()::text));

create policy "Participants can send messages"
  on public.chat_messages for insert
  with check (
    public.is_chat_participant(chat_id, auth.uid()::text)
    and sender_id = auth.uid()::text
  );

create policy "Senders can delete their messages"
  on public.chat_messages for delete
  using (sender_id = auth.uid()::text and public.is_chat_participant(chat_id, auth.uid()::text));

-- 6) Storage policies for chat_media
drop policy if exists "Public read chat media" on storage.objects;
drop policy if exists "Authenticated upload chat media" on storage.objects;
drop policy if exists "Owners can modify their chat media" on storage.objects;
drop policy if exists "Owners can delete their chat media" on storage.objects;

create policy "Public read chat media"
  on storage.objects for select
  using (bucket_id = 'chat_media');

create policy "Authenticated upload chat media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat_media');

create policy "Owners can modify their chat media"
  on storage.objects for update to authenticated
  using (bucket_id = 'chat_media' and owner = auth.uid());

create policy "Owners can delete their chat media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat_media' and owner = auth.uid());