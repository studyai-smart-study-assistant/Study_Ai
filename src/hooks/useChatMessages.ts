import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const sendMessage = async (content: string) => {
    if (!currentUser) return;
    
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: currentUser.uid,
      text_content: content,
      message_type: 'text'
    });
  };

  const sendImage = async (file: File) => {
    console.log('Sending image:', file);
  };

  const editMessage = async (messageId: string, content: string) => {
    await supabase.from('chat_messages')
      .update({ text_content: content, edited_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const deleteMessage = async (messageId: string) => {
    await supabase.from('chat_messages').delete().eq('id', messageId);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    console.log('Adding reaction:', emoji, 'to message:', messageId);
  };

  const replyToMessage = async (replyToId: string, content: string) => {
    if (!currentUser) return;
    
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: currentUser.uid,
      text_content: content,
      message_type: 'text',
      reply_to_id: replyToId
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(false);
      setMessages([]);
      setChatInfo({ name: 'Campus Chat' });
    };
    
    fetchData();
  }, [chatId]);

  return {
    messages,
    chatInfo,
    loading,
    sendMessage,
    sendImage,
    editMessage,
    deleteMessage,
    addReaction,
    replyToMessage
  };
};