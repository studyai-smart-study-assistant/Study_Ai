-- Enable realtime for call_notifications table
ALTER TABLE public.call_notifications REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notifications;