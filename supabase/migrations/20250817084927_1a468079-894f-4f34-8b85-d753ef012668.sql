-- Create campus users table to store Firebase auth user data in Supabase
CREATE TABLE public.campus_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campus_users ENABLE ROW LEVEL SECURITY;

-- Create policies for campus users
CREATE POLICY "Campus users are viewable by everyone" 
ON public.campus_users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own campus profile" 
ON public.campus_users 
FOR UPDATE 
USING (firebase_uid = (auth.uid())::text);

CREATE POLICY "Users can insert their own campus profile" 
ON public.campus_users 
FOR INSERT 
WITH CHECK (firebase_uid = (auth.uid())::text);

-- Create campus chats table
CREATE TABLE public.campus_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_uid TEXT NOT NULL,
  participant2_uid TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participant1_uid, participant2_uid)
);

-- Enable RLS
ALTER TABLE public.campus_chats ENABLE ROW LEVEL SECURITY;

-- Create policies for campus chats
CREATE POLICY "Users can view their own chats" 
ON public.campus_chats 
FOR SELECT 
USING (participant1_uid = (auth.uid())::text OR participant2_uid = (auth.uid())::text);

CREATE POLICY "Users can create chats they participate in" 
ON public.campus_chats 
FOR INSERT 
WITH CHECK (participant1_uid = (auth.uid())::text OR participant2_uid = (auth.uid())::text);

-- Create campus messages table
CREATE TABLE public.campus_messages (
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

-- Create policies for campus messages
CREATE POLICY "Users can view messages from their chats" 
ON public.campus_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campus_chats 
    WHERE id = chat_id 
    AND (participant1_uid = (auth.uid())::text OR participant2_uid = (auth.uid())::text)
  )
);

CREATE POLICY "Users can send messages to their chats" 
ON public.campus_messages 
FOR INSERT 
WITH CHECK (
  sender_uid = (auth.uid())::text AND
  EXISTS (
    SELECT 1 FROM public.campus_chats 
    WHERE id = chat_id 
    AND (participant1_uid = (auth.uid())::text OR participant2_uid = (auth.uid())::text)
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_campus_users_updated_at
BEFORE UPDATE ON public.campus_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all campus tables
ALTER TABLE public.campus_users REPLICA IDENTITY FULL;
ALTER TABLE public.campus_chats REPLICA IDENTITY FULL;
ALTER TABLE public.campus_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_messages;