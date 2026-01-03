
import React, { useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import StudentProfileQR from '@/components/student/StudentProfileQR';
import StudentActivitiesHelp from '@/components/student/StudentActivitiesHelp';
import StudentActivitiesHeader from './StudentActivitiesHeader';
import StudentActivitiesTabs from './StudentActivitiesTabs';
import FloatingLeaderboardWidget from '@/components/student/FloatingLeaderboardWidget';
import DailyLoginBonus from '@/components/student/DailyLoginBonus';
import { useMediaQuery } from '@/hooks/use-media-query';
import DailyStreakDisplay from '@/components/student/DailyStreakDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentStreakSync, updateDailyStreak } from '@/utils/streakUtils';
import { awardDailyLoginBonus } from '@/utils/points/bonusPoints';
import { toast } from 'sonner';
import { BannerAd } from '@/components/ads';

interface StudentActivitiesContainerProps {
  currentUser: any;
  studentPoints: number;
  setStudentPoints: (points: number) => void;
  studentLevel: number;
  setStudentLevel: (level: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSendMessage: (msg: string) => void;
  handleOpenQRDialog: () => void;
  isMobile: boolean;
}

const StudentActivitiesContainer: React.FC<StudentActivitiesContainerProps> = ({
  currentUser,
  studentPoints,
  setStudentPoints,
  studentLevel,
  setStudentLevel,
  activeTab,
  setActiveTab,
  onSendMessage,
  handleOpenQRDialog,
  isMobile,
}) => {
  const [loginBonusPoints, setLoginBonusPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [showStreakCard, setShowStreakCard] = useState(true);
  const [hasProcessedLogin, setHasProcessedLogin] = useState(false);
  
  useEffect(() => {
    if (currentUser && !hasProcessedLogin) {
      handleAutoLoginBonus();
      setHasProcessedLogin(true);
    }
  }, [currentUser, hasProcessedLogin]);

  const handleAutoLoginBonus = async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔄 Checking daily login bonus for user:', currentUser.uid);
      
      // Get current streak synchronously for immediate display
      const currentStreak = getCurrentStreakSync(currentUser.uid);
      setStreakDays(currentStreak);
      console.log('📊 Current streak from localStorage:', currentStreak);
      
      // Check and update daily streak
      const streakResult = await updateDailyStreak(currentUser.uid);
      console.log('🔥 Streak update result:', streakResult);
      
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
          
          // Show success toast
          toast.success(`दैनिक लॉगिन बोनस! +${streakResult.bonusPoints} पॉइंट्स मिले${streakMessage}`);
          
          console.log(`✅ Daily login bonus awarded: ${streakResult.bonusPoints} points for ${streakResult.newStreak} day streak`);
          
          // Update points display
          const newPoints = studentPoints + streakResult.bonusPoints;
          setStudentPoints(newPoints);
        }
      } else {
        // User already logged in today, just update display
        setStreakDays(currentStreak);
        console.log('ℹ️ User already logged in today');
      }
    } catch (error) {
      console.error('❌ Error in auto login bonus:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      <StudentActivitiesHeader 
        currentUser={currentUser}
        onOpenQRDialog={handleOpenQRDialog}
      />
      
      {/* Display daily streak if streak >= 0 */}
      {currentUser && showStreakCard && (
        <div className="mb-4">
          <DailyStreakDisplay 
            streakDays={streakDays} 
            userId={currentUser.uid}
            className="border-purple-200"
          />
        </div>
      )}
      
      <StudentActivitiesTabs
        currentUser={currentUser}
        studentPoints={studentPoints}
        setStudentPoints={setStudentPoints}
        studentLevel={studentLevel}
        setStudentLevel={setStudentLevel}
        onSendMessage={onSendMessage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      {/* Banner Ad */}
      <div className="my-4">
        <BannerAd className="mx-auto" />
      </div>
      
      <ScrollArea className={isMobile ? 'h-[calc(100vh-9rem)]' : 'h-[calc(100vh-8rem)]'}>
        <div className="h-0"></div>
      </ScrollArea>
      <StudentProfileQR 
        currentUser={currentUser}
        studentPoints={studentPoints}
        studentLevel={studentLevel}
      />
      <StudentActivitiesHelp />
      
      {/* Floating Leaderboard Widget */}
      {currentUser && <FloatingLeaderboardWidget currentUserId={currentUser.uid} />}
      
      {/* Daily Login Bonus Dialog */}
      {currentUser && loginBonusPoints > 0 && (
        <DailyLoginBonus 
          userId={currentUser.uid}
          points={loginBonusPoints}
          streakDays={streakDays}
        />
      )}
    </div>
  );
};

export default StudentActivitiesContainer;
