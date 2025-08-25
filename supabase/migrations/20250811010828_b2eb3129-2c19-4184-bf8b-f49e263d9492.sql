-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Create profiles table expected by the app
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
-- Everyone can view profiles (needed for showing avatars across the app)
create policy if not exists "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can insert their own profile
create policy if not exists "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy if not exists "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Users can delete their own profile
create policy if not exists "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- Timestamp trigger function (shared)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach trigger to profiles
create or replace trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Create public avatars bucket if missing
insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (select 1 from storage.buckets where id = 'avatars');

-- Storage policies for avatars
-- Public read for avatars
create policy if not exists "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload their own avatar (path starts with their uid/)
create policy if not exists "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
create policy if not exists "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
create policy if not exists "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );