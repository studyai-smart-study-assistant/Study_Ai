-- Create books table for library feature
CREATE TABLE IF NOT EXISTS public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  file_url TEXT,
  external_link TEXT,
  category TEXT NOT NULL DEFAULT 'अन्य',
  tags TEXT[] DEFAULT '{}',
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  likes INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public books
CREATE POLICY "Anyone can view public books"
ON public.books FOR SELECT
TO authenticated
USING (is_public = true);

-- Policy: Users can insert their own books
CREATE POLICY "Users can insert their own books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = (auth.uid())::text);

-- Policy: Users can update their own books
CREATE POLICY "Users can update their own books"
ON public.books FOR UPDATE
TO authenticated
USING (uploaded_by = (auth.uid())::text)
WITH CHECK (uploaded_by = (auth.uid())::text);

-- Policy: Users can delete their own books
CREATE POLICY "Users can delete their own books"
ON public.books FOR DELETE
TO authenticated
USING (uploaded_by = (auth.uid())::text);

-- Create book_likes table to track user likes
CREATE TABLE IF NOT EXISTS public.book_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Enable RLS
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all likes
CREATE POLICY "Anyone can view book likes"
ON public.book_likes FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own likes
CREATE POLICY "Users can like books"
ON public.book_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = (auth.uid())::text);

-- Policy: Users can unlike (delete their likes)
CREATE POLICY "Users can unlike books"
ON public.book_likes FOR DELETE
TO authenticated
USING (user_id = (auth.uid())::text);

-- Create storage bucket for books if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;