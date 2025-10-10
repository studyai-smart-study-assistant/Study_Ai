-- Create storage bucket for avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (anyone can read, only owner can update)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Storage RLS policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for chat media (for uploaded images in chat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_media',
  'chat_media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage RLS policies for chat media
CREATE POLICY "Chat media is publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chat_media');

CREATE POLICY "Authenticated users can upload chat media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat_media' 
    AND auth.uid() IS NOT NULL
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();