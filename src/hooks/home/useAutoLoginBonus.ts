
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { getCurrentStreakSync, updateDailyStreak } from '@/utils/streakUtils';
import { awardDailyLoginBonus } from '@/utils/points/bonusPoints';
import { getUserTimezone, getTimezoneDebugInfo } from '@/utils/timezoneUtils';

export const useAutoLoginBonus = () => {
  const [loginBonusPoints, setLoginBonusPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [hasProcessedLogin, setHasProcessedLogin] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && !hasProcessedLogin) {
      handleAutoLoginBonus();
      setHasProcessedLogin(true);
    }
  }, [currentUser, hasProcessedLogin]);

  const handleAutoLoginBonus = async () => {
    if (!currentUser) return;
    
    try {
      const userTimezone = getUserTimezone();
      const debugInfo = getTimezoneDebugInfo();
      console.log('🌍 Timezone Debug Info:', debugInfo);
      
      // Get current streak synchronously for immediate display
      const currentStreak = getCurrentStreakSync(currentUser.uid);
      setStreakDays(currentStreak);
      
      console.log(`🌍 Processing login bonus in timezone: ${userTimezone}`);
      console.log(`📊 Current streak from localStorage: ${currentStreak}`);
      
      // Check and update daily streak with timezone awareness
      const streakResult = await updateDailyStreak(currentUser.uid);
      console.log('🔥 Timezone-aware streak update result:', streakResult);
      
      if (streakResult.streakUpdated) {
        setStreakDays(streakResult.newStreak);
        setLoginBonusPoints(streakResult.bonusPoints);
        
        // Award the login bonus
        const bonusAwarded = await awardDailyLoginBonus(currentUser.uid);
        
        if (bonusAwarded) {
          let streakMessage = '';
          if (streakResult.newStreak % 7 === 0) {
            streakMessage = ` (${streakResult.newStreak} दिन की साप्ताहिक स्ट्रीक बोनस!)`;
          } else if (streakResult.newStreak % 3 === 0) {
            streakMessage = ` (${streakResult.newStreak} दिन की स्ट्रीक)`;
          } else if (streakResult.newStreak > 1) {
            streakMessage = ` (${streakResult.newStreak} दिन की स्ट्रीक)`;
          }
          
          // Show success toast with timezone info
          toast.success(`स्वागत है! +${streakResult.bonusPoints} पॉइंट्स मिले${streakMessage} (${userTimezone})`);
          
          console.log(`✅ Auto login bonus awarded: ${streakResult.bonusPoints} points for ${streakResult.newStreak} day streak in ${userTimezone}`);
        }
      } else {
        // User already logged in today, just update display
        setStreakDays(currentStreak);
        console.log(`ℹ️ User already logged in today in ${userTimezone}`);
      }
    } catch (error) {
      console.error('❌ Error in auto login bonus:', error);
    }
  };

  return { loginBonusPoints, streakDays };
};
