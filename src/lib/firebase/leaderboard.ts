
import { ref, get, query, orderByChild, limitToFirst, onValue } from "firebase/database";
import { database } from './config';

// Get leaderboard data
export const getLeaderboardData = async (limit: number = 10) => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const users: any[] = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      console.log(`🔥 Firebase user data for ${userData.displayName}:`, {
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        points: userData.points,
        lastLogin: userData.lastLogin
      });
      
      users.push({
        id: childSnapshot.key,
        name: userData.displayName || userData.name || `User_${childSnapshot.key?.substring(0, 5)}`,
        points: userData.points || 0,
        level: userData.level || 1,
        photoURL: userData.photoURL || null,
        // Get streak data directly from Firebase - this is the main source now
        streak: userData.currentStreak || 0,
        currentStreak: userData.currentStreak || 0,
        longestStreak: userData.longestStreak || 0,
        lastLogin: userData.lastLogin || null,
        lastStreakUpdate: userData.lastStreakUpdate || null,
        ...userData
      });
    });
    
    // Sort by points (and then by level if points are equal)
    users.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.level - a.level;
    });
    
    console.log('🔥 Processed leaderboard data with Firebase streaks:', users.slice(0, 3));
    
    // Return only the top N users
    return users.slice(0, limit);
  } catch (error) {
    console.error("Error getting leaderboard data:", error);
    throw error;
  }
};

// Observe leaderboard data in real-time
export const observeLeaderboardData = (
  callbackOrLimit: ((data: any[]) => void) | number = 10, 
  callback?: (data: any[]) => void
) => {
  // Handle both function signatures:
  // observeLeaderboardData(callback) - callbackOrLimit is the callback, use default limit
  // observeLeaderboardData(limit, callback) - callbackOrLimit is the limit, callback is provided
  const limit = typeof callbackOrLimit === 'function' ? 10 : callbackOrLimit;
  const finalCallback = typeof callbackOrLimit === 'function' ? callbackOrLimit : callback;
  
  if (!finalCallback) {
    throw new Error("Callback function is required for observeLeaderboardData");
  }
  
  const usersRef = ref(database, 'users');
  
  const unsubscribe = onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const users: any[] = [];
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        
        console.log(`🔥 Real-time Firebase user data for ${userData.displayName}:`, {
          currentStreak: userData.currentStreak,
          longestStreak: userData.longestStreak,
          points: userData.points,
          lastLogin: userData.lastLogin
        });
        
        users.push({
          id: childSnapshot.key,
          name: userData.displayName || userData.name || `User_${childSnapshot.key?.substring(0, 5)}`,
          points: userData.points || 0,
          level: userData.level || 1,
          photoURL: userData.photoURL || null,
          // Get streak data directly from Firebase - no localStorage fallback needed
          streak: userData.currentStreak || 0,
          currentStreak: userData.currentStreak || 0,
          longestStreak: userData.longestStreak || 0,
          lastLogin: userData.lastLogin || null,
          lastStreakUpdate: userData.lastStreakUpdate || null,
          ...userData
        });
      });
      
      // Sort by points (and then by level if points are equal)
      users.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.level - a.level;
      });
      
      // Add rank property
      users.forEach((user, index) => {
        user.rank = index + 1;
      });
      
      console.log('🔥 Real-time leaderboard data with Firebase streaks:', users.slice(0, 5));
      
      // Return only the top N users
      finalCallback(users.slice(0, limit));
    } else {
      finalCallback([]);
    }
  });
  
  return unsubscribe;
};
