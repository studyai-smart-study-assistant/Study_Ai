import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from './useNotifications';

export type CampusMessage = {
  id: string;
  chat_id: string;
  sender_uid: string;
  message_type: 'text' | 'image';
  text_content?: string | null;
  image_url?: string | null;
  created_at: string;
  edited_at?: string | null;
};

export type CampusChat = {
  id: string;
  participant1_uid: string;
  participant2_uid: string;
  created_at: string;
  last_message_at?: string | null;
};

export const useCampusChat = (otherUserUid: string | null) => {
  const [messages, setMessages] = useState<CampusMessage[]>([]);
  const [chat, setChat] = useState<CampusChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // Fetch user name for notifications
  const fetchUserName = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('campus_users')
        .select('display_name')
        .eq('firebase_uid', uid)
        .single();
      
      if (error) {
        console.error('Error fetching user name:', error);
        return 'Unknown User';
      }
      
      return data?.display_name || 'Unknown User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Unknown User';
    }
  };

  const createOrGetChat = async () => {
    if (!currentUser || !otherUserUid) return null;

    console.log('Creating/getting chat between:', currentUser.uid, 'and', otherUserUid);

    try {
      // Try to find existing chat
      const { data: existingChat, error: searchError } = await supabase
        .from('campus_chats')
        .select('*')
        .or(`and(participant1_uid.eq.${currentUser.uid},participant2_uid.eq.${otherUserUid}),and(participant1_uid.eq.${otherUserUid},participant2_uid.eq.${currentUser.uid})`)
        .maybeSingle();

      if (searchError) {
        console.error('Error searching for existing chat:', searchError);
      }

      if (existingChat) {
        console.log('Found existing chat:', existingChat);
        return existingChat;
      }

      console.log('Creating new chat...');
      // Create new chat
      const { data: newChat, error } = await supabase
        .from('campus_chats')
        .insert({
          participant1_uid: currentUser.uid,
          participant2_uid: otherUserUid
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new chat:', error);
        throw error;
      }
      
      console.log('New chat created:', newChat);
      return newChat;
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      return null;
    }
  };

  const loadMessages = async (chatId: string) => {
    console.log('Loading messages for chat:', chatId);
    try {
      // First verify this user is a participant in this chat
      const { data: chatData, error: chatError } = await supabase
        .from('campus_chats')
        .select('*')
        .eq('id', chatId)
        .or(`participant1_uid.eq.${currentUser?.uid},participant2_uid.eq.${currentUser?.uid}`)
        .single();

      if (chatError || !chatData) {
        console.error('User not authorized for this chat or chat not found:', chatError);
        setMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from('campus_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }
      
      console.log('Loaded messages:', data);
      setMessages((data || []) as CampusMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    if (!currentUser || !chat || sending) return;

    console.log('Attempting to send message:', { content, type, chatId: chat.id, currentUser: currentUser.uid });

    try {
      setSending(true);
      
      const messageData: any = {
        chat_id: chat.id,
        sender_uid: currentUser.uid,
        message_type: type
      };

      if (type === 'text') {
        messageData.text_content = content;
      } else {
        messageData.image_url = content;
      }

      console.log('Inserting message data:', messageData);

      const { data, error } = await supabase
        .from('campus_messages')
        .insert(messageData)
        .select();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      console.log('Message inserted successfully:', data);

      // Optimistic UI update to ensure message appears immediately
      if (data && data.length) {
        setMessages(prev => [...prev, ...(data as CampusMessage[])]);
      }

      // Update chat's last message time
      const { error: updateError } = await supabase
        .from('campus_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chat.id);

      if (updateError) {
        console.error('Error updating chat timestamp:', updateError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `campus-chat/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat_media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const sendImageMessage = async (file: File) => {
    try {
      const imageUrl = await uploadImage(file);
      await sendMessage(imageUrl, 'image');
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  };

  // Fetch other user name for notifications
  useEffect(() => {
    const loadOtherUserName = async () => {
      if (otherUserUid) {
        const name = await fetchUserName(otherUserUid);
        setOtherUserName(name);
      }
    };
    
    loadOtherUserName();
  }, [otherUserUid]);

  // Initialize chat and load messages
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser || !otherUserUid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const chatData = await createOrGetChat();
        if (chatData) {
          setChat(chatData);
          await loadMessages(chatData.id);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [currentUser, otherUserUid]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!chat || !currentUser) return;

    console.log('Setting up realtime subscription for chat:', chat.id);

    const channel = supabase
      .channel(`campus-chat-${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campus_messages',
          filter: `chat_id=eq.${chat.id}`
        },
        async (payload) => {
          console.log('Received new message via realtime:', payload);
          const newMessage = payload.new as CampusMessage;
          
          // Only add message if current user is a participant in this chat
          if (chat.participant1_uid === currentUser.uid || chat.participant2_uid === currentUser.uid) {
            // Check if message is from another user (not current user)
            const isFromOtherUser = newMessage.sender_uid !== currentUser.uid;
            
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            // Trigger notification only if message is from other user
            if (isFromOtherUser && otherUserName) {
              const messageContent = newMessage.message_type === 'text' 
                ? newMessage.text_content 
                : 'भेजी गई एक तस्वीर'; // "Sent an image" in Hindi
              
              console.log('Triggering notification for new message:', { sender: otherUserName, content: messageContent });
              
              addNotification({
                title: `${otherUserName}`,
                message: messageContent || 'नया संदेश', // "New message" in Hindi
                type: 'message',
                chatId: chat.id,
                senderName: otherUserName
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [chat, currentUser, otherUserName, addNotification]);

  return {
    messages,
    chat,
    loading,
    sending,
    sendMessage,
    sendImageMessage
  };
};