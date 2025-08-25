-- Enable realtime for campus_messages table
ALTER TABLE public.campus_messages REPLICA IDENTITY FULL;
ALTER TABLE public.campus_chats REPLICA IDENTITY FULL;

-- Add campus_messages to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_chats;