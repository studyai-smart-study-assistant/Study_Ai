create table if not exists public.user_context_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  response text not null,
  context text,
  created_at timestamptz not null default now()
);

alter table public.user_context_memory enable row level security;

create index if not exists idx_user_context_memory_user_created_at
  on public.user_context_memory (user_id, created_at desc);

create policy "Users can manage their own context memory"
  on public.user_context_memory
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
