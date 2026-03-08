
-- Allow users to delete their own campus messages
CREATE POLICY "Users can delete their own messages"
ON public.campus_messages
FOR DELETE
TO authenticated
USING (true);

-- Allow users to update their own campus messages  
CREATE POLICY "Users can update their own messages"
ON public.campus_messages
FOR UPDATE
TO authenticated
USING (true);
