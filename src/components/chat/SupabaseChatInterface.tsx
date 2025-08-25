
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Send, Image, Mic, File, Users, Phone, Video } from 'lucide-react';
import GroupAvatar from './GroupAvatar';

const supabaseAny = supabase as unknown as SupabaseClient<any>;

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  text_content?: string;
  image_path?: string;
  message_type: 'text' | 'image' | 'voice' | 'file';
  created_at: string;
}

interface SupabaseChatInterfaceProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
}

const SupabaseChatInterface: React.FC<SupabaseChatInterfaceProps> = ({
  groupId,
  groupName,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (groupId && currentUser) {
      loadMessages();
      loadMemberCount();
      setupRealtimeSubscription();
    }
  }, [groupId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabaseAny
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add sender names and ensure proper typing
      const messagesWithNames: Message[] = data.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_id === currentUser?.uid ? 'You' : `User ${msg.sender_id.slice(-4)}`,
        text_content: msg.content,
        image_path: msg.file_url,
        message_type: msg.message_type as 'text' | 'image' | 'voice' | 'file',
        created_at: msg.created_at
      }));

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemberCount = async () => {
    try {
      const { count, error } = await supabaseAny
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (error) throw error;
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error loading member count:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            sender_name: payload.new.sender_id === currentUser?.uid ? 'You' : `User ${payload.new.sender_id.slice(-4)}`
          } as Message;
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || isSending) return;

    try {
      setIsSending(true);
      
      const { error } = await supabaseAny
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: currentUser.uid,
          message_type: 'text',
          content: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setIsSending(true);
      
      // Upload to Supabase Storage
      const fileName = `${groupId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Send message with image path
      const { error: messageError } = await supabaseAny
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: currentUser.uid,
          message_type: 'image',
          file_url: fileName
        });

      if (messageError) throw messageError;
      
      toast.success('Image sent successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to send image');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('chat_media')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <GroupAvatar groupName={groupName} size="md" />
          
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{groupName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {memberCount} members
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-purple-100 dark:hover:bg-purple-900/40"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-purple-100 dark:hover:bg-purple-900/40"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender_id === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === currentUser?.uid
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}>
                {message.sender_id !== currentUser?.uid && (
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                    {message.sender_name}
                  </p>
                )}
                
                {message.message_type === 'text' && (
                  <p className="text-sm">{message.text_content}</p>
                )}
                
                {message.message_type === 'image' && message.image_path && (
                  <div className="space-y-2">
                    <img 
                      src={getImageUrl(message.image_path)}
                      alt="Shared image"
                      className="max-w-full h-auto rounded"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  message.sender_id === currentUser?.uid 
                    ? 'text-purple-100' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <GroupAvatar groupName={groupName} size="lg" className="mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Start the conversation in {groupName}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Share text, images, voice messages and files
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/40"
          >
            <Image className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            disabled={true}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/40 opacity-50"
            title="Voice messages coming soon"
          >
            <Mic className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            disabled={true}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/40 opacity-50"
            title="File sharing coming soon"
          >
            <File className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="border-purple-200 dark:border-purple-800 focus:border-purple-500"
              disabled={isSending}
            />
            
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseChatInterface;
