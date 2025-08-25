
import { addPointsToUserDb, ensureUserExists } from '@/lib/firebase/points';
import { PointRecord } from './types';

export async function addPointsToUser(
  userId: string,
  points: number,
  type: PointRecord['type'],
  description: string
): Promise<void> {
  if (!userId) return;
  
  try {
    console.log(`Adding ${points} points to user ${userId} for: ${description}`);
    
    // Add points to Firebase DB (only total points, not history)
    const result = await addPointsToUserDb(userId, points, description, type);
    
    // Update localStorage for immediate UI feedback
    if (result) {
      localStorage.setItem(`${userId}_points`, result.newPoints.toString());
      localStorage.setItem(`${userId}_level`, result.newLevel.toString());
      
      // Handle level up bonus
      if (result.leveledUp) {
        console.log(`User ${userId} leveled up to level ${result.newLevel}!`);
        
        // Add level up bonus points
        setTimeout(async () => {
          try {
            await addPointsToUserDb(userId, 10, `लेवल ${result.newLevel} पर पहुंचने का बोनस`, 'achievement');
            localStorage.setItem(`${userId}_points`, (result.newPoints + 10).toString());
            
            // Add level up bonus to localStorage history
            addPointRecord(userId, {
              id: Date.now(),
              type: 'achievement',
              points: 10,
              description: `लेवल ${result.newLevel} पर पहुंचने का बोनस`,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error("Error adding level up bonus:", error);
          }
        }, 1000);
      }
    }
    
    // Add points record to localStorage (ONLY localStorage, not Firebase)
    addPointRecord(userId, {
      id: Date.now(),
      type,
      points,
      description,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error in addPointsToUser:", error);
    // Fallback to localStorage only
    handlePointsError(userId, points, type, description);
  }
}

function handlePointsError(userId: string, points: number, type: PointRecord['type'], description: string) {
  console.log("Falling back to localStorage for points");
  
  const currentPoints = parseInt(localStorage.getItem(`${userId}_points`) || '0');
  const newTotalPoints = currentPoints + points;
  
  localStorage.setItem(`${userId}_points`, newTotalPoints.toString());
  
  const newLevel = Math.floor(newTotalPoints / 100) + 1;
  const currentLevel = parseInt(localStorage.getItem(`${userId}_level`) || '1');
  
  if (newLevel > currentLevel) {
    localStorage.setItem(`${userId}_level`, newLevel.toString());
    addPointRecord(userId, {
      id: Date.now() + 1,
      type: 'achievement',
      points: 10,
      description: `लेवल ${newLevel} पर पहुंचने का बोनस`,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(`${userId}_points`, (newTotalPoints + 10).toString());
  }
  
  addPointRecord(userId, {
    id: Date.now(),
    type,
    points,
    description,
    timestamp: new Date().toISOString()
  });
}

export function addPointRecord(userId: string, record: PointRecord): void {
  if (!userId) return;
  
  const historyKey = `${userId}_points_history`;
  const existingHistory = localStorage.getItem(historyKey);
  
  const history = existingHistory ? JSON.parse(existingHistory) : [];
  history.push(record);
  
  // Keep only last 100 records to prevent localStorage bloat
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  
  localStorage.setItem(historyKey, JSON.stringify(history));
  console.log(`Points history record added to localStorage: ${record.points} points for ${record.description}`);
}

// Function to sync user to Firebase when they login
export async function syncUserToFirebase(user: any): Promise<void> {
  if (!user || !user.uid) return;
  
  try {
    const userData = {
      displayName: user.displayName || 'Student',
      email: user.email || '',
      photoURL: user.photoURL || null,
      lastLogin: new Date().toISOString()
    };
    
    await ensureUserExists(user.uid, userData);
    
    // Sync total points to Firebase (not history)
    const localPoints = parseInt(localStorage.getItem(`${user.uid}_points`) || '0');
    
    if (localPoints > 0) {
      console.log(`Syncing ${localPoints} total points to Firebase (without history)`);
      // Update Firebase with current total points
      await addPointsToUserDb(user.uid, 0, 'Sync total points', 'sync');
    }
    
  } catch (error) {
    console.error('Error syncing user to Firebase:', error);
  }
}
