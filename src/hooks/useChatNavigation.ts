import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useChatNavigation = () => {
  const navigate = useNavigate();

  const startChatWithUser = async (userId: string, userDisplayName?: string) => {
    // Open chat with user (can be implemented later)
    console.log('Chat with user:', userId, userDisplayName);
  };

  const startChatWithUserById = async (userId: string) => {
    try {
      // Get user data first
      const { data: userData, error } = await supabase
        .from('campus_users')
        .select('*')
        .eq('firebase_uid', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      startChatWithUser(userId, userData.display_name);
    } catch (error) {
      console.error('Error in startChatWithUserById:', error);
    }
  };

  return {
    startChatWithUser,
    startChatWithUserById
  };
};