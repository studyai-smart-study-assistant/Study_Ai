
import { ref, push, set, get, update, remove } from "firebase/database";
import { database, auth } from '../config';

// Create a new group chat
export const createChatGroup = async (name: string, members: {[uid: string]: boolean}) => {
  try {
    console.log("Creating group with name:", name, "and members:", members);
    
    const groupsRef = ref(database, 'groups');
    const newGroupRef = push(groupsRef);
    const groupId = newGroupRef.key;
    
    if (!groupId) {
      throw new Error("Failed to generate group ID");
    }
    
    // Add creator as admin by default
    const currentUserUid = auth.currentUser?.uid;
    if (!currentUserUid) {
      throw new Error("User must be logged in to create a group");
    }
    
    const admins = {
      [currentUserUid]: true
    };
    
    console.log("Setting group data for group ID:", groupId);
    
    // Create group data object
    const groupData = {
      name,
      members,
      admins,
      createdAt: Date.now(),
      createdBy: currentUserUid,
      lastMessageTime: Date.now()
    };
    
    // Set group data
    await set(ref(database, `groups/${groupId}`), groupData);
    
    // Create welcome message
    const welcomeMessage = {
      sender: "system",
      senderName: "System",
      text: `Welcome to ${name}! Group created successfully.`,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiration
    };
    
    // Add welcome message
    const messagesRef = ref(database, `groups/${groupId}/messages`);
    await push(messagesRef, welcomeMessage);
    
    console.log("Group created successfully with ID:", groupId);
    return groupId;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

// Get details of a specific group
export const getGroupDetails = async (groupId: string) => {
  try {
    console.log("Fetching group details for:", groupId);
    const groupSnapshot = await get(ref(database, `groups/${groupId}`));
    if (!groupSnapshot.exists()) {
      throw new Error("Group not found");
    }
    
    const groupData = groupSnapshot.val();
    console.log("Group details fetched:", groupData);
    return groupData;
  } catch (error) {
    console.error("Error fetching group details:", error);
    throw error;
  }
};

// Add or remove a user from a group
export const updateGroupMembership = async (groupId: string, userId: string, isAdding: boolean) => {
  try {
    console.log("Updating group membership:", { groupId, userId, isAdding });
    
    const currentUserUid = auth.currentUser?.uid;
    if (!currentUserUid) {
      throw new Error("You must be logged in to update group membership");
    }
    
    // Check if current user is an admin
    const groupSnapshot = await get(ref(database, `groups/${groupId}`));
    if (!groupSnapshot.exists()) {
      throw new Error("Group not found");
    }
    
    const groupData = groupSnapshot.val();
    if (!groupData.admins || !groupData.admins[currentUserUid]) {
      throw new Error("Only group admins can update membership");
    }
    
    // Update membership
    if (isAdding) {
      await update(ref(database, `groups/${groupId}/members`), {
        [userId]: true
      });
      console.log("User added to group:", userId);
    } else {
      // Remove member properly
      await remove(ref(database, `groups/${groupId}/members/${userId}`));
      console.log("User removed from group:", userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error updating group membership:", error);
    throw error;
  }
};

// Delete a group chat (only for admins)
export const deleteGroup = async (groupId: string) => {
  try {
    console.log("Deleting group:", groupId);
    
    const currentUserUid = auth.currentUser?.uid;
    if (!currentUserUid) {
      throw new Error("You must be logged in to delete a group");
    }
    
    // Check if the current user is an admin
    const groupSnapshot = await get(ref(database, `groups/${groupId}`));
    if (!groupSnapshot.exists()) {
      throw new Error("Group not found");
    }
    
    const groupData = groupSnapshot.val();
    if (!groupData.admins || !groupData.admins[currentUserUid]) {
      throw new Error("Only group admins can delete the group");
    }
    
    // Delete the entire group
    await remove(ref(database, `groups/${groupId}`));
    console.log("Group deleted successfully:", groupId);
    return true;
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};
