
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Image, Mic, File, Users, Phone, Video } from 'lucide-react';
import GroupAvatar from './GroupAvatar';
import { buildChatMediaPath } from '@/lib/chat/media-path';

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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('group_chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames: Message[] = (data || []).map((msg) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_id === currentUser?.uid ? 'You' : `User ${msg.sender_id.slice(-4)}`,
        text_content: msg.content,
        message_type: (msg.role === 'assistant' ? 'text' : 'text') as 'text',
        created_at: msg.created_at
      }));

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, currentUser]);

  const loadMemberCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('group_participants')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (error) throw error;
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error loading member count:', error);
    }
  }, [groupId]);

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const newMsg: Message = {
            id: raw.id as string,
            sender_id: raw.sender_id as string,
            sender_name: (raw.sender_id as string) === currentUser?.uid ? 'You' : `User ${(raw.sender_id as string).slice(-4)}`,
            text_content: raw.content as string,
            message_type: 'text',
            created_at: raw.created_at as string,
          };
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUser]);

  useEffect(() => {
    if (!groupId || !currentUser) return;
    void loadMessages();
    void loadMemberCount();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [groupId, currentUser, loadMessages, loadMemberCount, setupRealtimeSubscription]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || isSending) return;

    try {
      setIsSending(true);
      
      const { error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          sender_id: currentUser.uid,
          role: 'user',
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
      const fileName = buildChatMediaPath(currentUser.uid, groupId, file.name, 'group_chat_messages');
      const { error: uploadError } = await supabase.storage.from('chat_media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('chat_media').getPublicUrl(fileName);

      const { error: messageError } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          sender_id: currentUser.uid,
          role: 'user',
          content: `![image](${urlData.publicUrl})`
        });

      if (messageError) throw messageError;
      toast.success('Image sent!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to send image');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GroupAvatar groupName={groupName} size="md" />
          <div>
            <h2 className="font-semibold text-foreground">{groupName}</h2>
            <p className="text-sm text-muted-foreground flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {memberCount} members
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender_id === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === currentUser?.uid
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}>
                {message.sender_id !== currentUser?.uid && (
                  <p className="text-xs font-semibold text-primary mb-1">{message.sender_name}</p>
                )}
                <p className="text-sm">{message.text_content}</p>
                <p className={`text-xs mt-1 ${message.sender_id === currentUser?.uid ? 'opacity-70' : 'text-muted-foreground'}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <GroupAvatar groupName={groupName} size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Start the conversation in {groupName}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled title="Coming soon"><Mic className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" disabled title="Coming soon"><File className="h-4 w-4" /></Button>
          <div className="flex-1 flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending} className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseChatInterface;
