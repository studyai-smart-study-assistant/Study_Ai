import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CampusUser } from './useCampusUsers';

export const useChatNavigation = () => {
  const navigate = useNavigate();

  const startChatWithUser = async (userId: string, userDisplayName?: string) => {
    // Navigate to campus talks with user selection
    navigate('/campus-talks', { 
      state: { 
        selectUserId: userId,
        selectUserName: userDisplayName 
      } 
    });
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
        // Still navigate but without extra data
        navigate('/campus-talks', { state: { selectUserId: userId } });
        return;
      }

      startChatWithUser(userId, userData.display_name);
    } catch (error) {
      console.error('Error in startChatWithUserById:', error);
      navigate('/campus-talks', { state: { selectUserId: userId } });
    }
  };

  return {
    startChatWithUser,
    startChatWithUserById
  };
};