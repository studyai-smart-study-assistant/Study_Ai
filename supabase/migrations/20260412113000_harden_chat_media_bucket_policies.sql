-- Harden chat media storage to a per-user ownership model.
-- Upload path contract (frontend): <auth.uid()>/<conversationId>/...

-- 1) Ensure dedicated bucket exists and is not public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat_media',
  'chat_media',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'application/pdf']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Remove permissive/legacy policies for chat_media bucket.
drop policy if exists "Chat media is publicly accessible" on storage.objects;
drop policy if exists "Public read chat media" on storage.objects;
drop policy if exists "Authenticated users can upload chat media" on storage.objects;
drop policy if exists "Authenticated upload chat media" on storage.objects;
drop policy if exists "Owners can modify their chat media" on storage.objects;
drop policy if exists "Owners can delete their chat media" on storage.objects;
drop policy if exists "chat_media_public_read" on storage.objects;
drop policy if exists "chat_media_insert_authenticated" on storage.objects;
drop policy if exists "chat_media_update_owner" on storage.objects;
drop policy if exists "chat_media_delete_owner" on storage.objects;

-- 3) Enforce owner path prefix rules: <auth.uid()>/<conversationId>/...
create policy "chat_media_select_owner_only"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'chat_media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "chat_media_insert_owner_prefix"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'chat_media'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((storage.foldername(name))[2], '') <> ''
  );

create policy "chat_media_update_owner_prefix"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'chat_media'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'chat_media'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((storage.foldername(name))[2], '') <> ''
  );

create policy "chat_media_delete_owner_prefix"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'chat_media'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Production rollout safety checks (manual/preflight):
--    Validate legacy links and object path compatibility before enforcing this in production.
--    a) Count legacy objects that do NOT match <uid>/<conversationId>/... path shape:
--       select count(*) from storage.objects
--       where bucket_id = 'chat_media'
--         and (
--           (storage.foldername(name))[1] is null
--           or (storage.foldername(name))[2] is null
--         );
--    b) Verify chat message links still resolve for historical content (sample by newest rows first).
--       select id, image_url, created_at from public.campus_messages
--       where image_url is not null
--       order by created_at desc
--       limit 100;
