-- Create campus_users table for user presence
CREATE TABLE IF NOT EXISTS public.campus_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campus_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campus_users
CREATE POLICY "Anyone can view campus users"
  ON public.campus_users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own status"
  ON public.campus_users FOR UPDATE
  USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can insert their own record"
  ON public.campus_users FOR INSERT
  WITH CHECK (firebase_uid = auth.uid()::text);

-- Create campus_chats table
CREATE TABLE IF NOT EXISTS public.campus_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_uid TEXT NOT NULL,
  participant2_uid TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.campus_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campus_chats
CREATE POLICY "Users can view their own chats"
  ON public.campus_chats FOR SELECT
  USING (participant1_uid = auth.uid()::text OR participant2_uid = auth.uid()::text);

CREATE POLICY "Users can create chats"
  ON public.campus_chats FOR INSERT
  WITH CHECK (participant1_uid = auth.uid()::text OR participant2_uid = auth.uid()::text);

CREATE POLICY "Users can update their own chats"
  ON public.campus_chats FOR UPDATE
  USING (participant1_uid = auth.uid()::text OR participant2_uid = auth.uid()::text);

-- Create campus_messages table
CREATE TABLE IF NOT EXISTS public.campus_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.campus_chats(id) ON DELETE CASCADE,
  sender_uid TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  text_content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.campus_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campus_messages
CREATE POLICY "Users can view messages in their chats"
  ON public.campus_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campus_chats
      WHERE campus_chats.id = campus_messages.chat_id
      AND (campus_chats.participant1_uid = auth.uid()::text OR campus_chats.participant2_uid = auth.uid()::text)
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON public.campus_messages FOR INSERT
  WITH CHECK (
    sender_uid = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.campus_chats
      WHERE campus_chats.id = campus_messages.chat_id
      AND (campus_chats.participant1_uid = auth.uid()::text OR campus_chats.participant2_uid = auth.uid()::text)
    )
  );

-- Create chat_messages table for general chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text_content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (sender_id = auth.uid()::text);

CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::text);

CREATE POLICY "Users can update their own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (sender_id = auth.uid()::text);

CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  USING (sender_id = auth.uid()::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campus_users_firebase_uid ON public.campus_users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_campus_chats_participants ON public.campus_chats(participant1_uid, participant2_uid);
CREATE INDEX IF NOT EXISTS idx_campus_messages_chat_id ON public.campus_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);