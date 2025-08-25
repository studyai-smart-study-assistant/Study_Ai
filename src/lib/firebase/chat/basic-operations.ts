
import { ref, get, push, set, update } from "firebase/database";
import { database, auth } from '../config';

// Generate a unique chat ID for two users
export const getChatId = (uid1: string, uid2: string) => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

// Get a user's display name
export const getUserName = async (userId: string) => {
  try {
    const userSnapshot = await get(ref(database, `users/${userId}`));
    if (!userSnapshot.exists()) {
      return null;
    }
    
    return userSnapshot.val().displayName || `User_${userId.substring(0, 5)}`;
  } catch (error) {
    console.error("Error fetching user name:", error);
    return null;
  }
};

// Start a 1-on-1 chat with another user
export const startChat = async (currentUserId: string, otherUserId: string) => {
  try {
    const chatId = getChatId(currentUserId, otherUserId);
    
    // Check if chat already exists
    const chatSnapshot = await get(ref(database, `chats/${chatId}`));
    if (!chatSnapshot.exists()) {
      // Create new chat
      await set(ref(database, `chats/${chatId}`), {
        participants: {
          [currentUserId]: true,
          [otherUserId]: true
        },
        createdAt: Date.now()
      });
    }
    
    return chatId;
  } catch (error) {
    console.error("Error starting chat:", error);
    throw error;
  }
};
