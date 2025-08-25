-- Remove demo users
DELETE FROM public.profiles WHERE user_id IN ('demo_user_1', 'demo_user_2', 'demo_user_3', 'demo_user_4', 'study_assistant');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, avatar_url)
  VALUES (
    NEW.id::text,
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id::text
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add new users to profiles table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();