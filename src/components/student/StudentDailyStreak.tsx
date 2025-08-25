
import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Star, Calendar, Award } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { addPointsToUser } from '@/utils/points';
import { getStreakData, updateDailyStreak, getCurrentStreakSync, getLongestStreakSync } from '@/utils/streakUtils';
import { addPointsToUserDb } from '@/lib/firebase/points';

interface StudentDailyStreakProps {
  currentUser: any;
}

const StudentDailyStreak: React.FC<StudentDailyStreakProps> = ({ currentUser }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      loadStreakData();
    }
  }, [currentUser]);
  
  const loadStreakData = async () => {
    if (!currentUser) return;
    
    console.log('📊 Loading streak data for user:', currentUser.uid);
    
    // Use sync version for immediate display
    const syncStreak = getCurrentStreakSync(currentUser.uid);
    const syncLongest = getLongestStreakSync(currentUser.uid);
    setCurrentStreak(syncStreak);
    setLongestStreak(syncLongest);
    
    try {
      // Then update with Firebase data
      const streakData = await getStreakData(currentUser.uid);
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🔥 Firebase streak data:', streakData);
      
      setCurrentStreak(streakData.currentStreak);
      setLongestStreak(streakData.longestStreak);
      setLastLoginDate(streakData.lastLoginDate);
      setTodayCheckedIn(streakData.lastLoginDate === today);
      setWeeklyProgress(Math.min(streakData.currentStreak, 7) * (100/7));
      
      console.log('✅ Streak data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading streak data:', error);
    }
  };
  
  const handleDailyCheckIn = async () => {
    if (todayCheckedIn || !currentUser || loading) {
      console.log('⚠️ Check-in blocked:', { todayCheckedIn, currentUser: !!currentUser, loading });
      return;
    }
    
    setLoading(true);
    console.log('🔄 Starting daily check-in for user:', currentUser.uid);
    
    try {
      const streakResult = await updateDailyStreak(currentUser.uid);
      console.log('🔥 Daily streak result:', streakResult);
      
      if (!streakResult.streakUpdated) {
        toast.info('आज आपने पहले से ही चेक-इन किया है!');
        setLoading(false);
        return;
      }
      
      const { newStreak, bonusPoints } = streakResult;
      
      let streakMessage = '';
      if (newStreak % 7 === 0) {
        streakMessage = ` (${newStreak} दिन की साप्ताहिक स्ट्रीक बोनस!)`;
      } else if (newStreak % 3 === 0) {
        streakMessage = ` (${newStreak} दिन की स्ट्रीक बोनस!)`;
      } else {
        streakMessage = ` (${newStreak} दिन की स्ट्रीक)`;
      }
      
      // Add points to local system
      await addPointsToUser(
        currentUser.uid, 
        bonusPoints, 
        'streak', 
        `दैनिक चेक-इन${streakMessage}`
      );
      
      // Also sync to Firebase database
      try {
        await addPointsToUserDb(currentUser.uid, bonusPoints, `दैनिक चेक-इन${streakMessage}`, 'streak');
        console.log('✅ Points synced to Firebase database');
      } catch (error) {
        console.error("❌ Error syncing to Firebase:", error);
      }
      
      // Reload streak data to reflect changes
      await loadStreakData();
      
      toast.success(`चेक-इन सफल! +${bonusPoints} पॉइंट्स मिले${streakMessage}`);
      console.log(`✅ Daily check-in successful: +${bonusPoints} points, ${newStreak} day streak`);
      
    } catch (error) {
      console.error('❌ Error in daily check-in:', error);
      toast.error('चेक-इन में समस्या हुई, कृपया पुनः प्रयास करें');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CardContent className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            दैनिक स्ट्रीक
          </h3>
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {currentStreak} दिन
          </Badge>
        </div>
        
        <div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, index) => {
              const isActive = index < Math.min(currentStreak, 7);
              return (
                <div 
                  key={index} 
                  className={`h-8 rounded-md flex items-center justify-center 
                  ${isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  {isActive && <Flame className="h-4 w-4" />}
                </div>
              );
            })}
          </div>
          
          <Progress value={weeklyProgress} className="h-2 mb-2" />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 दिन</span>
            <span>7 दिन</span>
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">सबसे लंबी स्ट्रीक</span>
            </div>
            <Badge variant="secondary">{longestStreak} दिन</Badge>
          </div>
          
          <button
            onClick={handleDailyCheckIn}
            disabled={todayCheckedIn || loading}
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 
            ${todayCheckedIn || loading
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : todayCheckedIn ? (
              <>
                <Star className="h-4 w-4" />
                आज चेक-इन पूरा हो गया
              </>
            ) : (
              <>
                <Flame className="h-4 w-4" />
                आज का चेक-इन करें
              </>
            )}
          </button>
          
          {lastLoginDate && (
            <div className="mt-2 text-xs text-center text-gray-500 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              अंतिम चेक-इन: {new Date(lastLoginDate).toLocaleDateString('hi-IN')}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );
};

export default StudentDailyStreak;
