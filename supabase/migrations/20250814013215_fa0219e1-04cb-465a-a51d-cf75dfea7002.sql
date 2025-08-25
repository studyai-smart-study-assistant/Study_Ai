-- Insert some demo users for testing the direct chat functionality
INSERT INTO public.profiles (user_id, avatar_url) VALUES 
  ('demo_user_1', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo1'),
  ('demo_user_2', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo2'),
  ('demo_user_3', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo3'),
  ('demo_user_4', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo4'),
  ('study_assistant', 'https://api.dicebear.com/7.x/bottts/svg?seed=assistant')
ON CONFLICT (user_id) DO NOTHING;