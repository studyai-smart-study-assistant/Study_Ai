
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import GroupChatModal from '@/components/chat/GroupChatModal';
import ChatInterface from '@/components/chat/ChatInterface';
import GroupAvatar from '@/components/chat/GroupAvatar';
import { getUserChats, getUserGroups } from '@/lib/supabase/chat-functions';
import { Chat } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import ProfilePopover from '@/components/profile/ProfilePopover';

const ChatSystem = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadChats = async () => {
      if (!currentUser) { setChats([]); setIsLoading(false); return; }
      try {
        const userChats = await getUserChats(currentUser.uid);
        const groupChats = await getUserGroups(currentUser.uid);
        const allChats: Chat[] = [...userChats.map(c => ({...c, type: "user" as const})), ...groupChats.map(c => ({...c, type: "group" as const}))];
        allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChats(allChats);
      } catch { toast.error("Failed to load chats"); setChats([]); }
      finally { setIsLoading(false); }
    };
    loadChats();
  }, [currentUser]);

  const handleCreateGroup = async (groupId: string) => {
    const groupChats = await getUserGroups(currentUser!.uid);
    const newGroup = groupChats.find(g => g.id === groupId);
    if (newGroup) { setChats(prev => [{...newGroup, type: "group" as const}, ...prev]); setSelectedChat({...newGroup, type: "group"}); toast.success("Group created!"); }
  };

  if (selectedChat) return <div className="h-[calc(100vh-56px)]"><ChatInterface recipientId={selectedChat.partnerId || selectedChat.id} chatId={selectedChat.id} isGroup={selectedChat.type === 'group'} onBack={() => setSelectedChat(null)} /></div>;

  return (
    <div className="container py-4 max-w-3xl mx-auto">
      <Card className="border border-purple-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-purple-50 to-indigo-50"><div><CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Messages</CardTitle><CardDescription>Your conversations</CardDescription></div><Button onClick={() => setIsCreateGroupOpen(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600"><Plus className="h-4 w-4 mr-2" />New Group</Button></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div> : chats.length > 0 ? (
            <div className="divide-y">
              {chats.map((chat) => (
                <div key={chat.id} className="py-4 px-6 flex items-center space-x-4 cursor-pointer hover:bg-purple-50 transition-all" onClick={() => setSelectedChat(chat)}>
                  {chat.type === 'group' ? <GroupAvatar groupName={chat.name} size="md" /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg"><MessageCircle className="h-6 w-6" /></div>}
                  <div className="flex-1"><h3 className="font-semibold">{chat.name}</h3><p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'No messages yet'}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6"><GroupAvatar groupName="Chat" size="xl" className="mx-auto mb-6" /><h3 className="text-xl font-semibold mb-2">No conversations yet</h3><Button onClick={() => setIsCreateGroupOpen(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600"><Plus className="h-4 w-4 mr-2" />Create Your First Group</Button></div>
          )}
        </CardContent>
      </Card>
      <GroupChatModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} onGroupCreated={handleCreateGroup} />
    </div>
  );
};

export default ChatSystem;
