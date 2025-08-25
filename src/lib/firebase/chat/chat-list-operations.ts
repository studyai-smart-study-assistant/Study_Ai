
import { ref, get } from "firebase/database";
import { database } from '../config';

// Get user's 1-on-1 chats
export const getUserChats = async (userId: string) => {
  try {
    const chatsSnapshot = await get(ref(database, 'chats'));
    if (!chatsSnapshot.exists()) {
      return [];
    }
    
    const chatsData = chatsSnapshot.val();
    const userChats = Object.entries(chatsData)
      .filter(([chatId]) => chatId.includes(userId))
      .map(async ([chatId, chatData]: [string, any]) => {
        // Extract the other user's ID
        const otherUserId = chatId.replace(userId, '').replace('_', '');
        const userSnapshot = await get(ref(database, `users/${otherUserId}`));
        let userName = 'Unknown User';
        
        if (userSnapshot.exists()) {
          userName = userSnapshot.val().displayName || `User_${otherUserId.substring(0, 5)}`;
        }
        
        return {
          id: chatId,
          type: 'user',
          name: userName,
          lastMessage: chatData.lastMessage || '',
          timestamp: chatData.lastMessageTime || 0,
          partnerId: otherUserId
        };
      });
    
    return await Promise.all(userChats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    return [];
  }
};

// Get user's group chats
export const getUserGroups = async (userId: string) => {
  try {
    const groupsSnapshot = await get(ref(database, 'groups'));
    if (!groupsSnapshot.exists()) {
      return [];
    }
    
    const groupsData = groupsSnapshot.val();
    const userGroups = Object.entries(groupsData)
      .filter(([_, groupData]: [string, any]) => {
        return groupData.members && groupData.members[userId];
      })
      .map(([groupId, groupData]: [string, any]) => {
        return {
          id: groupId,
          type: 'group',
          name: groupData.name || 'Unnamed Group',
          lastMessage: groupData.lastMessage || '',
          timestamp: groupData.lastMessageTime || groupData.createdAt || 0,
        };
      });
    
    return userGroups;
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return [];
  }
};
