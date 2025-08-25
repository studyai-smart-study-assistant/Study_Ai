
import { ref, push, set, get, query, orderByChild, limitToLast, update } from "firebase/database";
import { database } from './config';

// Add points to a user and ensure proper Firebase sync
export const addPointsToUserDb = async (userId: string, points: number, reason: string, type?: string) => {
  try {
    // Get current user data
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    let userData: any = {};
    let currentPoints = 0;
    let currentLevel = 1;
    
    if (snapshot.exists()) {
      userData = snapshot.val();
      currentPoints = userData.points || 0;
      currentLevel = userData.level || 1;
    } else {
      // If user doesn't exist, create basic user data
      console.log(`Creating new user record for ${userId}`);
    }
    
    const newPoints = currentPoints + points;
    
    // Calculate new level (simple algorithm: 100 points per level)
    let newLevel = Math.floor(newPoints / 100) + 1;
    
    // Update user's main data (only total points and level, not history)
    const updatedUserData = {
      ...userData,
      points: newPoints,
      level: newLevel,
      lastUpdated: Date.now()
    };
    
    await set(userRef, updatedUserData);
    
    console.log(`Points added successfully: User ${userId} got ${points} points. Total: ${newPoints}`);
    
    return {
      previousPoints: currentPoints,
      newPoints: newPoints,
      previousLevel: currentLevel,
      newLevel,
      leveledUp: newLevel > currentLevel
    };
  } catch (error) {
    console.error("Error adding points to Firebase:", error);
    throw error;
  }
};

// Get user's point history from localStorage only
export const getUserPointsHistory = async (userId: string, limit: number = 20) => {
  try {
    const historyKey = `${userId}_points_history`;
    const savedHistory = localStorage.getItem(historyKey);
    
    if (!savedHistory) {
      return [];
    }
    
    const history = JSON.parse(savedHistory);
    
    // Sort by timestamp (newest first) and limit
    return history
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting points history from localStorage:", error);
    return [];
  }
};

// Ensure user exists in Firebase when they first login/register
export const ensureUserExists = async (userId: string, userData: any) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      const newUserData = {
        ...userData,
        points: 0,
        level: 1,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
      
      await set(userRef, newUserData);
      console.log(`New user created in Firebase: ${userId}`);
    } else {
      // Update existing user with any new data
      const existingData = snapshot.val();
      const updatedData = {
        ...existingData,
        ...userData,
        lastUpdated: Date.now()
      };
      
      await update(userRef, updatedData);
      console.log(`User data updated in Firebase: ${userId}`);
    }
  } catch (error) {
    console.error("Error ensuring user exists:", error);
  }
};
