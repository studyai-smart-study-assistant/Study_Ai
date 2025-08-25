
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import GroupChatModal from '@/components/chat/GroupChatModal';
import ChatInterface from '@/components/chat/ChatInterface';
import GroupAvatar from '@/components/chat/GroupAvatar';
import { getUserChats, getUserGroups } from '@/lib/firebase';
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
      if (!currentUser) {
        console.log("No current user, clearing chats");
        setChats([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log("Loading chats for user:", currentUser.uid);
        
        // Ensure current user has a profile and sync users from Firebase if needed
        await ensureUserProfile();
        
        // Get user-to-user chats
        const userChats = await getUserChats(currentUser.uid);
        console.log("User chats loaded:", userChats);
        
        // Get group chats
        const groupChats = await getUserGroups(currentUser.uid);
        console.log("Group chats loaded:", groupChats);
        
        // Combine both types of chats and ensure they match the Chat type
        const allChats: Chat[] = [
          ...userChats.map(chat => ({
            ...chat,
            type: "user" as const
          })),
          ...groupChats.map(chat => ({
            ...chat,
            type: "group" as const
          }))
        ];
        
        // Sort by timestamp (newest first)
        allChats.sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA;
        });
        
        // Load profiles for user chats
        await loadProfilesForChats(allChats);
        
        console.log("All chats loaded:", allChats);
        setChats(allChats);
      } catch (error) {
        console.error("Error loading chats:", error);
        toast.error("Failed to load chat list");
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [currentUser]);

  const ensureUserProfile = async () => {
    if (!currentUser?.uid) return;

    try {
      // Check if current user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', currentUser.uid)
        .maybeSingle();

      if (!profile) {
        // Create profile for current user
        await supabase
          .from('profiles')
          .insert({
            user_id: currentUser.uid,
            display_name: currentUser.displayName || `User_${currentUser.uid.slice(0, 8)}`,
            avatar_url: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`
          });

        // Sync all Firebase users to Supabase
        console.log("Syncing Firebase users to Supabase...");
        toast.success("Users synced successfully");
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error);
    }
  };

  const loadProfilesForChats = async (chats: Chat[]) => {
    try {
      // Get all unique user IDs from user chats
      const userIds = chats
        .filter(chat => chat.type === 'user' && chat.partnerId)
        .map(chat => chat.partnerId)
        .filter((id): id is string => Boolean(id));

      if (userIds.length === 0) return;

      // Load profiles from Supabase
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesData) {
        const profilesMap = profilesData.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, any>);
        
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const handleCreateGroup = async (groupId: string) => {
    console.log("Group created with ID:", groupId);
    
    if (!currentUser) {
      toast.error("Please login to create groups");
      return;
    }
    
    try {
      // Refresh the chat list to include the new group
      const groupChats = await getUserGroups(currentUser.uid);
      const newGroup = groupChats.find(g => g.id === groupId);
      
      if (newGroup) {
        const newGroupChat = { ...newGroup, type: "group" as const };
        setChats(prev => [newGroupChat, ...prev]);
        setSelectedChat(newGroupChat);
        toast.success("Group created successfully!");
      } else {
        console.error("New group not found in updated list");
        // Refresh entire chat list
        const userChats = await getUserChats(currentUser.uid);
        const allGroupChats = await getUserGroups(currentUser.uid);
        
        const allChats: Chat[] = [
          ...userChats.map(chat => ({ ...chat, type: "user" as const })),
          ...allGroupChats.map(chat => ({ ...chat, type: "group" as const }))
        ];
        
        allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChats(allChats);
      }
    } catch (error) {
      console.error("Error handling group creation:", error);
      toast.error("Failed to load new group");
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    // Refresh chat list when returning
    if (currentUser) {
      setIsLoading(true);
      Promise.all([
        getUserChats(currentUser.uid),
        getUserGroups(currentUser.uid)
      ]).then(([userChats, groupChats]) => {
        const allChats: Chat[] = [
          ...userChats.map(chat => ({
            ...chat,
            type: "user" as const
          })),
          ...groupChats.map(chat => ({
            ...chat,
            type: "group" as const
          }))
        ];
        
        allChats.sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA;
        });
        
        setChats(allChats);
        setIsLoading(false);
      }).catch(error => {
        console.error("Error refreshing chats:", error);
        setIsLoading(false);
      });
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString();
  };

  // If a chat is selected, show the chat interface
  if (selectedChat) {
    return (
      <div className="h-[calc(100vh-56px)]">
        <ChatInterface 
          recipientId={selectedChat.partnerId || selectedChat.id} 
          chatId={selectedChat.id}
          isGroup={selectedChat.type === 'group'}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // Otherwise show the chat list
  return (
    <div className="container py-4 max-w-3xl mx-auto">
      <Card className="border border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Messages
            </CardTitle>
            <CardDescription>Your conversations and group chats</CardDescription>
          </div>
          <Button onClick={() => setIsCreateGroupOpen(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : chats.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {chats.map((chat, index) => (
                <div 
                  key={chat.id}
                  className="py-4 px-6 flex items-center space-x-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/10 dark:hover:to-indigo-900/10 transition-all duration-200 group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedChat(chat)}
                >
                  {chat.type === 'group' ? (
                    <GroupAvatar
                      groupName={chat.name}
                      size="md"
                      className="group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ProfilePopover 
                      userId={chat.partnerId || ''} 
                      onStartChat={(userId) => {
                        // Already in chat with this user
                        setSelectedChat(chat);
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform cursor-pointer">
                        {profiles[chat.partnerId || '']?.display_name?.slice(0, 2).toUpperCase() || <MessageCircle className="h-6 w-6" />}
                      </div>
                    </ProfilePopover>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {chat.type === 'user' && chat.partnerId 
                          ? profiles[chat.partnerId]?.display_name || chat.name 
                          : chat.name
                        }
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(chat.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage || (chat.type === 'group' ? 'Group created' : 'No messages yet')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6">
                <GroupAvatar
                  groupName="Chat"
                  size="xl"
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                No conversations yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start chatting with users from the leaderboard or create a new group to begin conversations.
              </p>
              <Button 
                onClick={() => setIsCreateGroupOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <GroupChatModal 
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleCreateGroup}
      />
    </div>
  );
};

export default ChatSystem;
