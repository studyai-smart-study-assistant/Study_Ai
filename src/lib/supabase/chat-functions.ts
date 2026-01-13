
import { supabase } from "@/integrations/supabase/client";

// Group details
export async function getGroupDetails(groupId: string) {
  try {
    // For now, return basic group info from chat_messages table
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', groupId)
      .limit(1);
    
    if (error) {
      console.error('Error fetching group details:', error);
      return {
        id: groupId,
        name: 'Group Chat',
        members: {},
        admins: {}
      };
    }
    
    return {
      id: groupId,
      name: 'Group Chat',
      members: {},
      admins: {}
    };
  } catch (error) {
    console.error('Error in getGroupDetails:', error);
    return {
      id: groupId,
      name: 'Group Chat',
      members: {},
      admins: {}
    };
  }
}

// Listen for messages (realtime)
export function listenForMessages(
  chatId: string, 
  isGroup: boolean, 
  callback: (messages: any[]) => void
): () => void {
  // Initial fetch
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) {
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        text: msg.text_content || '',
        sender: msg.sender_id,
        timestamp: new Date(msg.created_at).getTime(),
        type: msg.message_type
      }));
      callback(formattedMessages);
    }
  };
  
  fetchMessages();
  
  // Subscribe to realtime
  const channel = supabase
    .channel(`chat-${chatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`
      },
      () => {
        fetchMessages();
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Send message
export async function sendMessage(
  chatId: string, 
  senderId: string, 
  text: string, 
  isGroup?: boolean
) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      text_content: text,
      message_type: 'text'
    });
  
  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Delete message
export async function deleteMessage(
  chatId: string, 
  messageId: string, 
  isGroup?: boolean
) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);
  
  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

// Toggle save message (mark as important)
export async function toggleSaveMessage(
  chatId: string, 
  messageId: string, 
  isGroup?: boolean
): Promise<boolean> {
  // For now, just return toggled state
  // This would need a saved_messages table for full implementation
  console.log('Toggle save message:', messageId);
  return true;
}

// Delete group
export async function deleteGroup(groupId: string) {
  // Delete all messages in the group
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('chat_id', groupId);
  
  if (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

// Update group membership
export async function updateGroupMembership(
  groupId: string, 
  userId: string, 
  add: boolean
) {
  // For now, log the action
  // This would need a group_members table for full implementation
  console.log(`${add ? 'Adding' : 'Removing'} user ${userId} from group ${groupId}`);
}

// Create chat group
export async function createChatGroup(
  name: string, 
  members: { [key: string]: boolean }
): Promise<string> {
  // Generate a unique group ID
  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // For now, just return the group ID
  // This would need a groups table for full implementation
  console.log('Creating group:', name, 'with members:', Object.keys(members));
  
  return groupId;
}

// Get user chats
export async function getUserChats(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('campus_chats')
      .select('*')
      .or(`participant1_uid.eq.${userId},participant2_uid.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(chat => ({
      id: chat.id,
      name: 'Chat',
      partnerId: chat.participant1_uid === userId ? chat.participant2_uid : chat.participant1_uid,
      timestamp: new Date(chat.last_message_at || chat.created_at).getTime(),
      type: 'user'
    }));
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
}

// Get user groups
export async function getUserGroups(userId: string): Promise<any[]> {
  // For now, return empty array
  // This would need a groups table for full implementation
  return [];
}

// Get leaderboard data
export async function getLeaderboardData(): Promise<any[]> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return (profiles || []).map((profile, index) => ({
      id: profile.user_id,
      name: profile.display_name || 'Student',
      points: profile.points || 0,
      level: profile.level || 1,
      photoURL: profile.photo_url || profile.avatar_url,
      rank: index + 1,
      streak: profile.current_streak || 0
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Observe leaderboard data
export function observeLeaderboardData(
  limit: number,
  callback: (data: any[]) => void
): () => void {
  // Initial fetch
  const fetchData = async () => {
    const data = await getLeaderboardData();
    callback(data.slice(0, limit));
  };
  
  fetchData();
  
  // Subscribe to changes
  const channel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles'
      },
      () => {
        fetchData();
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Get user points history
export async function getUserPointsHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      type: item.transaction_type,
      points: item.amount,
      description: item.reason,
      timestamp: item.created_at
    }));
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

// Add points to user
export async function addPointsToUserDb(
  userId: string, 
  points: number, 
  reason: string, 
  type: string = 'activity'
) {
  try {
    // Get current balance
    const { data: currentPoints } = await supabase
      .from('user_points')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    
    const currentBalance = currentPoints?.balance || 0;
    const newBalance = currentBalance + points;
    
    // Upsert user points
    await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    
    // Add transaction record
    await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        amount: points,
        balance_after: newBalance,
        reason,
        transaction_type: type
      });
    
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
}

// Logout user
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  localStorage.clear();
}
