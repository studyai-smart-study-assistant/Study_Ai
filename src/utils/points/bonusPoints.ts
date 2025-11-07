
import { addPointsToUser, syncUserPoints } from './core';
import { updateDailyStreak } from '../streakUtils';

export async function awardDailyLoginBonus(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const streakResult = await updateDailyStreak(userId);
    
    if (!streakResult.streakUpdated) {
      // User already logged in today
      return false;
    }
    
    const { newStreak, bonusPoints } = streakResult;
    
    let streakMessage = '';
    if (newStreak % 7 === 0 && newStreak > 0) {
      streakMessage = ` (${newStreak} दिन की साप्ताहिक स्ट्रीक बोनस!)`;
    } else if (newStreak % 3 === 0 && newStreak > 0) {
      streakMessage = ` (${newStreak} दिन की स्ट्रीक)`;
    } else if (newStreak > 1) {
      streakMessage = ` (${newStreak} दिन की स्ट्रीक)`;
    }
    
    await addPointsToUser(
      userId, 
      bonusPoints, 
      'login', 
      `दैनिक लॉगिन${streakMessage}`
    );
    
    console.log(`Daily login bonus awarded: ${bonusPoints} points for ${newStreak} day streak`);
    
    return true;
  } catch (error) {
    console.error("Error awarding daily login bonus:", error);
    return false;
  }
}

// Add a new function to award points for completing study sessions
export async function addStudySessionPoints(
  userId: string, 
  minutes: number, 
  subject: string
): Promise<void> {
  if (!userId || minutes <= 0) return;
  
  // Base points calculation - 1 point per 5 minutes studied
  const basePoints = Math.floor(minutes / 5);
  
  // Bonus for longer sessions
  let bonusPoints = 0;
  let message = `${minutes} मिनट का अध्ययन पूरा किया`;
  
  if (minutes >= 60) {
    bonusPoints = 10; // Bonus for 1+ hour sessions
    message = `${minutes} मिनट का लंबा अध्ययन सत्र पूरा किया!`;
  } else if (minutes >= 30) {
    bonusPoints = 5; // Bonus for 30+ minute sessions
  }
  
  const totalPoints = basePoints + bonusPoints;
  
  // Add subject to message if provided
  if (subject && subject.trim() !== '') {
    message = `${subject}: ${message}`;
  }
  
  await addPointsToUser(userId, totalPoints, 'activity', message);
}
