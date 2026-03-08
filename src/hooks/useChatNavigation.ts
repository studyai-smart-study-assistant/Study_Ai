import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useChatNavigation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const startChatWithUser = async (userId: string, userDisplayName?: string) => {
    if (!currentUser) {
      toast.error('कृपया पहले लॉगिन करें');
      navigate('/login');
      return;
    }

    try {
      // Check if a chat already exists between these two users
      const { data: existingChat, error: chatError } = await supabase
        .from('campus_chats')
        .select('*')
        .or(`and(participant1_uid.eq.${currentUser.uid},participant2_uid.eq.${userId}),and(participant1_uid.eq.${userId},participant2_uid.eq.${currentUser.uid})`)
        .maybeSingle();

      if (chatError) {
        console.error('Error checking existing chat:', chatError);
      }

      let chatId: string;

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        // Create a new chat
        const { data: newChat, error: createError } = await supabase
          .from('campus_chats')
          .insert({
            participant1_uid: currentUser.uid,
            participant2_uid: userId
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating chat:', createError);
          toast.error('चैट शुरू नहीं हो सका');
          return;
        }
        chatId = newChat.id;
      }

      // Navigate to chat system with the chat details
      navigate('/chat-system', { 
        state: { 
          selectedChatId: chatId, 
          partnerId: userId, 
          partnerName: userDisplayName 
        } 
      });
      toast.success(`${userDisplayName || 'User'} से चैट शुरू हो रही है`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('चैट शुरू नहीं हो सका');
    }
  };

  const startChatWithUserById = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('campus_users')
        .select('*')
        .eq('firebase_uid', userId)
        .single();

      if (error) {
        // Try profiles table as fallback
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching user data:', profileError);
          // Still try to start chat with unknown name
          await startChatWithUser(userId, 'User');
          return;
        }

        await startChatWithUser(userId, profileData.display_name || 'User');
        return;
      }

      await startChatWithUser(userId, userData.display_name || 'User');
    } catch (error) {
      console.error('Error in startChatWithUserById:', error);
    }
  };

  return {
    startChatWithUser,
    startChatWithUserById
  };
};