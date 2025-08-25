-- Enable RLS and realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Add missing columns to support Campus Talks features
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS forwarded_from uuid REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;

-- Add chat metadata
ALTER TABLE chats ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add user status tracking for online presence
CREATE TABLE IF NOT EXISTS user_presence (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    status text NOT NULL DEFAULT 'offline', -- 'online', 'offline', 'away'
    last_seen timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_presence
CREATE POLICY "Users can view all presence" 
ON user_presence FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own presence" 
ON user_presence FOR INSERT 
WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can update their own presence status" 
ON user_presence FOR UPDATE 
USING (user_id = (auth.uid())::text);

-- Function to update user presence timestamp
CREATE OR REPLACE FUNCTION update_user_presence()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
CREATE TRIGGER update_user_presence_timestamp
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence();

-- Enable realtime for user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;