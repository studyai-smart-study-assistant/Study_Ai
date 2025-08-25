import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Users, Image, Mic, FileText } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from '@supabase/supabase-js';
import SupabaseGroupChatModal from '@/components/chat/SupabaseGroupChatModal';
import SupabaseChatInterface from '@/components/chat/SupabaseChatInterface';
import GroupAvatar from '@/components/chat/GroupAvatar';

const supabaseAny = supabase as unknown as SupabaseClient<any>;

interface SupabaseGroup {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  member_count?: number;
  last_message?: string;
  last_message_time?: string;
}

const SupabaseChatSystem = () => {
  const [groups, setGroups] = useState<SupabaseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SupabaseGroup | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadUserGroups();
      setupRealtimeSubscription();
    }
  }, [currentUser]);

  const loadUserGroups = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      
      // Get groups where user is a member
      const { data: memberGroups, error: memberError } = await supabaseAny
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            created_at,
            created_by
          )
        `)
        .eq('user_id', currentUser.uid);

      if (memberError) throw memberError;

      // Get member counts and last messages for each group
      const groupsWithDetails = await Promise.all(
        (memberGroups || []).map(async (member: any) => {
          const group = member.groups;
          if (!group) return null;

          // Get member count
          const { count: memberCount } = await supabaseAny
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Get last message
          const { data: lastMessage } = await supabaseAny
            .from('group_messages')
            .select('content, created_at')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...group,
            member_count: memberCount || 0,
            last_message: lastMessage?.content || 'No messages yet',
            last_message_time: lastMessage?.created_at
          };
        })
      );

      const validGroups = groupsWithDetails.filter(group => group !== null);
      setGroups(validGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load chat groups');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser) return;

    // Listen for new groups
    const groupsChannel = supabase
      .channel('user-groups')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${currentUser.uid}`
        },
        () => {
          loadUserGroups();
        }
      )
      .subscribe();

    // Listen for new messages to update last message
    const messagesChannel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages'
        },
        () => {
          loadUserGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const handleCreateGroup = async (groupData: { name: string; memberIds: string[] }) => {
    if (!currentUser) return;

    try {
      // Create group
      const { data: newGroup, error: groupError } = await supabaseAny
        .from('groups')
        .insert({
          name: groupData.name,
          created_by: currentUser.uid
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabaseAny
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUser.uid,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // Add other members
      if (groupData.memberIds.length > 0) {
        const { error: otherMembersError } = await supabaseAny
          .from('group_members')
          .insert(
            groupData.memberIds.map(userId => ({
              group_id: newGroup.id,
              user_id: userId,
              role: 'member'
            }))
          );

        if (otherMembersError) throw otherMembersError;
      }

      toast.success('Group created successfully!');
      setSelectedGroup(newGroup);
      loadUserGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleBackToList = () => {
    setSelectedGroup(null);
    loadUserGroups();
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString();
  };

  // If a group is selected, show the chat interface
  if (selectedGroup) {
    return (
      <div className="h-[calc(100vh-56px)]">
        <SupabaseChatInterface 
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // Otherwise show the group list
  return (
    <div className="container py-4 max-w-3xl mx-auto">
      <Card className="border border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <div>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Enhanced Chat Groups
            </CardTitle>
            <CardDescription>
              Real-time messaging with media sharing • Voice messages • File uploads
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsCreateGroupOpen(true)} 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : groups.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {groups.map((group, index) => (
                <div 
                  key={group.id}
                  className="py-4 px-6 flex items-center space-x-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/10 dark:hover:to-indigo-900/10 transition-all duration-200 group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedGroup(group)}
                >
                  <GroupAvatar
                    groupName={group.name}
                    size="md"
                    className="group-hover:scale-105 transition-transform"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {group.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(group.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.member_count} members
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                      {group.last_message}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Image className="h-3 w-3" />
                      <Mic className="h-3 w-3" />
                      <FileText className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6">
                <GroupAvatar
                  groupName="Enhanced Chat"
                  size="xl"
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Welcome to Enhanced Chat
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Create groups with rich media support - share images, voice messages, files and more for better collaborative learning.
              </p>
              <Button 
                onClick={() => setIsCreateGroupOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Enhanced Group
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <SupabaseGroupChatModal 
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleCreateGroup}
      />
    </div>
  );
};

export default SupabaseChatSystem;
