
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CampusTalkHeader from '@/components/campus-talk/CampusTalkHeader';
import CampusTalkChatList from '@/components/campus-talk/CampusTalkChatList';
import CampusTalkBottomNav from '@/components/campus-talk/CampusTalkBottomNav';
import CampusTalkUsersList from '@/components/campus-talk/CampusTalkUsersList';
import CampusTalkConversation from '@/components/campus-talk/CampusTalkConversation';
import CampusTalkAccount from '@/components/campus-talk/CampusTalkAccount';
import CampusTalkGroupList from '@/components/campus-talk/CampusTalkGroupList';

export interface CampusChatItem {
  chatId: string;
  partnerUid: string;
  partnerName: string;
  partnerAvatar?: string | null;
  lastMessage?: string;
  lastMessageTime?: string | null;
  unread?: number;
}

const ChatSystem = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'chats' | 'users' | 'groups' | 'account'>('chats');
  const [chatList, setChatList] = useState<CampusChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<CampusChatItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-register current user in campus_users with correct profile name
  useEffect(() => {
    if (!currentUser) return;
    const registerCampusUser = async () => {
      try {
        // Get actual display name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, photo_url')
          .eq('user_id', currentUser.uid)
          .maybeSingle();

        const displayName = profile?.display_name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        const avatarUrl = profile?.avatar_url || profile?.photo_url || currentUser.photoURL;

        await supabase.from('campus_users').upsert({
          firebase_uid: currentUser.uid,
          display_name: displayName,
          avatar_url: avatarUrl,
          email: currentUser.email,
          status: 'online',
          last_seen: new Date().toISOString(),
        }, { onConflict: 'firebase_uid' });
      } catch (err) {
        console.error('Error registering campus user:', err);
      }
    };
    registerCampusUser();

    return () => {
      supabase.from('campus_users').update({ 
        status: 'offline', 
        last_seen: new Date().toISOString() 
      }).eq('firebase_uid', currentUser.uid).then(() => {});
    };
  }, [currentUser]);

  // Handle navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedChatId && state?.partnerId) {
      setSelectedChat({
        chatId: state.selectedChatId,
        partnerUid: state.partnerId,
        partnerName: state.partnerName || 'User',
      });
    }
  }, [location.state]);

  // Load user's existing chats
  useEffect(() => {
    if (!currentUser) return;
    loadChats();

    const channel = supabase
      .channel('campus-chat-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campus_messages',
      }, () => {
        loadChats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const loadChats = async () => {
    if (!currentUser) return;
    try {
      const { data: chats, error } = await supabase
        .from('campus_chats')
        .select('*')
        .or(`participant1_uid.eq.${currentUser.uid},participant2_uid.eq.${currentUser.uid}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (!chats || chats.length === 0) {
        setChatList([]);
        setIsLoading(false);
        return;
      }

      const partnerUids = chats.map(c => 
        c.participant1_uid === currentUser.uid ? c.participant2_uid : c.participant1_uid
      );

      // Fetch from profiles for accurate names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, photo_url')
        .in('user_id', partnerUids);

      const { data: campusProfiles } = await supabase
        .from('campus_users')
        .select('firebase_uid, display_name, avatar_url')
        .in('firebase_uid', partnerUids);

      const chatItems: CampusChatItem[] = await Promise.all(
        chats.map(async (chat) => {
          const partnerUid = chat.participant1_uid === currentUser.uid 
            ? chat.participant2_uid 
            : chat.participant1_uid;
          
          const profile = profiles?.find(p => p.user_id === partnerUid);
          const campusProfile = campusProfiles?.find(p => p.firebase_uid === partnerUid);

          const { data: lastMsg } = await supabase
            .from('campus_messages')
            .select('text_content, message_type, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let lastMessage = 'No messages yet';
          if (lastMsg) {
            if (lastMsg.message_type === 'image') lastMessage = '📷 Photo';
            else lastMessage = lastMsg.text_content || '';
          }

          return {
            chatId: chat.id,
            partnerUid,
            partnerName: profile?.display_name || campusProfile?.display_name || partnerUid.slice(0, 8),
            partnerAvatar: profile?.avatar_url || profile?.photo_url || campusProfile?.avatar_url,
            lastMessage,
            lastMessageTime: lastMsg?.created_at || chat.last_message_at,
          };
        })
      );

      setChatList(chatItems);
    } catch (err) {
      console.error('Error loading chats:', err);
      toast.error('चैट लोड करने में समस्या');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (targetUid: string, targetName: string, targetAvatar?: string | null) => {
    if (!currentUser) return;

    try {
      const { data: existing } = await supabase
        .from('campus_chats')
        .select('*')
        .or(`and(participant1_uid.eq.${currentUser.uid},participant2_uid.eq.${targetUid}),and(participant1_uid.eq.${targetUid},participant2_uid.eq.${currentUser.uid})`)
        .maybeSingle();

      if (existing) {
        setSelectedChat({
          chatId: existing.id,
          partnerUid: targetUid,
          partnerName: targetName,
          partnerAvatar: targetAvatar,
        });
        return;
      }

      const { data: newChat, error } = await supabase
        .from('campus_chats')
        .insert({
          participant1_uid: currentUser.uid,
          participant2_uid: targetUid,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedChat({
        chatId: newChat.id,
        partnerUid: targetUid,
        partnerName: targetName,
        partnerAvatar: targetAvatar,
      });

      loadChats();
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error('चैट शुरू करने में समस्या');
    }
  };

  if (selectedChat) {
    return (
      <CampusTalkConversation
        chatId={selectedChat.chatId}
        partnerUid={selectedChat.partnerUid}
        partnerName={selectedChat.partnerName}
        partnerAvatar={selectedChat.partnerAvatar}
        onBack={() => { setSelectedChat(null); loadChats(); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <CampusTalkHeader 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />

      <div className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'chats' && (
          <CampusTalkChatList
            chats={chatList}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSelectChat={(chat) => setSelectedChat(chat)}
          />
        )}
        {activeTab === 'users' && (
          <CampusTalkUsersList
            onStartChat={handleStartChat}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === 'groups' && (
          <CampusTalkGroupList searchQuery={searchQuery} />
        )}
        {activeTab === 'account' && (
          <CampusTalkAccount />
        )}
      </div>

      <CampusTalkBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default ChatSystem;
