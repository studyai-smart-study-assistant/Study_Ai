
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Target, 
  Users, 
  BookOpen, 
  Clock,
  CheckSquare,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Share2,
  Flame
} from 'lucide-react';
import StudentGoals from '@/components/student/StudentGoals';
import StudentLeaderboard from '@/components/student/StudentLeaderboard';
import StudentTasks from '@/components/student/StudentTasks';
import StudyTimerWidget from '@/components/student/StudyTimerWidget';
import ActiveStudyPlanWidget from '@/components/study/ActiveStudyPlanWidget';
import { useIsMobile } from '@/hooks/use-mobile';
import StudentProfileCard from '@/components/student/StudentProfileCard';
import PointsStore from '@/components/student/PointsStore';
import EnhancedStreakDisplay from '@/components/student/EnhancedStreakDisplay';
import UserConnectionsHub from '@/components/student/UserConnectionsHub';
import { getCurrentStreakSync, getLongestStreakSync } from '@/utils/streakUtils';
import { useState, useEffect } from 'react';

interface StudentActivitiesTabsProps {
  currentUser: any;
  studentPoints: number;
  setStudentPoints: (points: number) => void;
  studentLevel: number;
  setStudentLevel: (level: number) => void;
  onSendMessage: (msg: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const StudentActivitiesTabs: React.FC<StudentActivitiesTabsProps> = ({
  currentUser,
  studentPoints,
  setStudentPoints,
  studentLevel,
  setStudentLevel,
  onSendMessage,
  activeTab,
  setActiveTab,
}) => {
  const isMobile = useIsMobile();
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    if (currentUser) {
      setStreakDays(getCurrentStreakSync(currentUser.uid));
      setLongestStreak(getLongestStreakSync(currentUser.uid));
    }
  }, [currentUser]);

  const handlePurchase = (itemId: string, cost: number) => {
    const newPoints = studentPoints - cost;
    setStudentPoints(newPoints);
    localStorage.setItem(`${currentUser.uid}_points`, newPoints.toString());
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-4' : 'grid-cols-8'} mb-6`}>
        <TabsTrigger value="goals" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          {!isMobile && <span>Goals</span>}
        </TabsTrigger>
        <TabsTrigger value="leaderboard" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          {!isMobile && <span>Leaderboard</span>}
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          {!isMobile && <span>Tasks</span>}
        </TabsTrigger>
        <TabsTrigger value="study-plans" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {!isMobile && <span>Study Plans</span>}
        </TabsTrigger>
        <TabsTrigger value="timer" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {!isMobile && <span>Timer</span>}
        </TabsTrigger>
        <TabsTrigger value="store" className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          {!isMobile && <span>Store</span>}
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          {!isMobile && <span>Profile</span>}
        </TabsTrigger>
        <TabsTrigger value="connections" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {!isMobile && <span>Connect</span>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="goals">
        <StudentGoals
          currentUser={currentUser}
          studentPoints={studentPoints}
          setStudentPoints={setStudentPoints}
          studentLevel={studentLevel}
          setStudentLevel={setStudentLevel}
        />
      </TabsContent>

      <TabsContent value="leaderboard">
        <StudentLeaderboard currentUser={currentUser} />
      </TabsContent>

      <TabsContent value="tasks">
        <StudentTasks
          currentUser={currentUser}
          studentPoints={studentPoints}
          setStudentPoints={setStudentPoints}
          studentLevel={studentLevel}
          setStudentLevel={setStudentLevel}
        />
      </TabsContent>

      <TabsContent value="study-plans">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Your Active Study Plans</h2>
          </div>
          <ActiveStudyPlanWidget />
        </div>
      </TabsContent>

      <TabsContent value="timer">
        <StudyTimerWidget 
          currentUser={currentUser}
        />
      </TabsContent>

      <TabsContent value="store">
        <PointsStore 
          userId={currentUser.uid}
          currentPoints={studentPoints}
          onPurchase={handlePurchase}
        />
      </TabsContent>

      <TabsContent value="profile">
        <div className="space-y-6">
          <StudentProfileCard
            currentUser={currentUser}
            studentPoints={studentPoints}
            studentLevel={studentLevel}
            streakDays={streakDays}
          />
          <EnhancedStreakDisplay
            streakDays={streakDays}
            longestStreak={longestStreak}
            userId={currentUser.uid}
          />
        </div>
      </TabsContent>

      <TabsContent value="connections">
        <UserConnectionsHub currentUserId={currentUser.uid} />
      </TabsContent>
    </Tabs>
  );
};

export default StudentActivitiesTabs;
