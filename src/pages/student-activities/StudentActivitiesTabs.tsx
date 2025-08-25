
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
  Calendar
} from 'lucide-react';
import StudentGoals from '@/components/student/StudentGoals';
import StudentLeaderboard from '@/components/student/StudentLeaderboard';
import StudentTasks from '@/components/student/StudentTasks';
import StudyTimerWidget from '@/components/student/StudyTimerWidget';
import ActiveStudyPlanWidget from '@/components/study/ActiveStudyPlanWidget';
import { useIsMobile } from '@/hooks/use-mobile';

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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} mb-6`}>
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
        {!isMobile && (
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Progress</span>
          </TabsTrigger>
        )}
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

      {!isMobile && (
        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Study Progress
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your learning progress and achievements here.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Performance Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View detailed analytics of your study performance.
              </p>
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default StudentActivitiesTabs;
