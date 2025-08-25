-- Relax chat media upload policy to allow public uploads (temporary)
DROP POLICY IF EXISTS "Authenticated upload chat media" ON storage.objects;

CREATE POLICY "Public upload chat media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'chat_media');