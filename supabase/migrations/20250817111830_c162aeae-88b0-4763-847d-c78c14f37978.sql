-- Create call_notifications table for video/audio calling
CREATE TABLE public.call_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  from_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('video', 'audio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for call notifications
CREATE POLICY "Users can view their own call notifications" 
ON public.call_notifications 
FOR SELECT 
USING (auth.uid()::text = from_user OR auth.uid()::text = to_user);

CREATE POLICY "Users can create call notifications" 
ON public.call_notifications 
FOR INSERT 
WITH CHECK (auth.uid()::text = from_user);

CREATE POLICY "Users can update their call notifications" 
ON public.call_notifications 
FOR UPDATE 
USING (auth.uid()::text = from_user OR auth.uid()::text = to_user);

-- Create function to update timestamps
CREATE TRIGGER update_call_notifications_updated_at
BEFORE UPDATE ON public.call_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();