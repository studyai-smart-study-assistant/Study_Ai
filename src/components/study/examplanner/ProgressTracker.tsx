import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/student/Badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Target, 
  Calendar, 
  Star, 
  TrendingUp, 
  Award,
  Flame,
  Brain,
  CheckCircle,
  Clock,
  BookOpen,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StudyPlan, ExamPlanData, UserProgress } from './types';
import { EnhancedPointsSystem } from '@/utils/enhancedPointsSystem';
import { toast } from 'sonner';
import SmartRecommendations from './SmartRecommendations';
import EnhancedAnalytics from './EnhancedAnalytics';
import StudyPersonalization from './StudyPersonalization';

interface ProgressTrackerProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  onSendMessage: (msg: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  studyPlan,
  examData,
  onSendMessage
}) => {
  const { currentUser } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to get duration as number
  const getDurationAsNumber = (duration: number | string): number => {
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string') {
      const parsed = parseInt(duration);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserProgress();
      loadTodayTasks();
    }
  }, [currentUser, studyPlan]);

  const loadUserProgress = () => {
    if (!currentUser?.uid) return;

    const savedProgress = localStorage.getItem(`progress_${currentUser.uid}_${examData.examName}`);
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    } else {
      const initialProgress: UserProgress = {
        userId: currentUser.uid,
        examPlanId: examData.examName,
        totalTasksCompleted: 0,
        totalTasksAssigned: studyPlan.dailyTasks.length,
        currentStreak: 0,
        totalPoints: 0,
        badges: [],
        lastActivityDate: '',
        weeklyProgress: [],
        studentFeedbacks: []
      };
      setUserProgress(initialProgress);
    }
  };

  const loadTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = studyPlan.dailyTasks.filter(task => task.date === today);
    setTodayTasks(tasks);
  };

  const updateProgress = (newProgress: UserProgress) => {
    if (currentUser?.uid) {
      setUserProgress(newProgress);
      localStorage.setItem(`progress_${currentUser.uid}_${examData.examName}`, JSON.stringify(newProgress));
    }
  };

  const markTaskComplete = async (taskId: string) => {
    if (!userProgress || !currentUser?.uid) return;

    const task = studyPlan.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const durationInMinutes = getDurationAsNumber(task.duration);
      const pointsEarned = await EnhancedPointsSystem.awardTaskCompletionPoints(
        currentUser.uid,
        'daily_task',
        {
          subject: task.subject,
          description: `${task.chapter} - ${task.topic}`,
          timeSpent: durationInMinutes * 60
        }
      );

      task.completed = true;
      task.completedAt = Date.now();

      const newProgress = {
        ...userProgress,
        totalTasksCompleted: userProgress.totalTasksCompleted + 1,
        totalPoints: userProgress.totalPoints + pointsEarned,
        lastActivityDate: new Date().toISOString().split('T')[0]
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (userProgress.lastActivityDate === yesterday.toISOString().split('T')[0]) {
        newProgress.currentStreak = userProgress.currentStreak + 1;
      } else {
        newProgress.currentStreak = 1;
      }

      const newBadges = checkForNewBadges(newProgress);
      if (newBadges.length > 0) {
        newProgress.badges = [...userProgress.badges, ...newBadges];
        newBadges.forEach(badge => {
          toast.success(`🏆 नया बैज मिला: ${badge.name}!`);
        });
      }

      updateProgress(newProgress);
      toast.success(`✅ Task complete! ${pointsEarned} points मिले!`);

    } catch (error) {
      console.error('Error marking task complete:', error);
      toast.error('Task complete करने में error हुई');
    }
  };

  const checkForNewBadges = (progress: UserProgress) => {
    const newBadges: any[] = [];
    const existingBadgeIds = progress.badges.map(b => b.id);

    if (progress.totalTasksCompleted === 1 && !existingBadgeIds.includes('first_task')) {
      newBadges.push({
        id: 'first_task',
        name: 'पहला कदम',
        description: 'पहला task complete किया',
        icon: '🎯',
        earnedAt: Date.now()
      });
    }

    if (progress.currentStreak === 7 && !existingBadgeIds.includes('week_streak')) {
      newBadges.push({
        id: 'week_streak',
        name: 'साप्ताहिक योद्धा',
        description: '7 दिन लगातार अध्ययन',
        icon: '🔥',
        earnedAt: Date.now()
      });
    }

    if (progress.totalPoints >= 100 && !existingBadgeIds.includes('hundred_points')) {
      newBadges.push({
        id: 'hundred_points',
        name: 'शतक खिलाड़ी',
        description: '100 points हासिल किए',
        icon: '💯',
        earnedAt: Date.now()
      });
    }

    return newBadges;
  };

  const sendProgressToChat = () => {
    if (!userProgress) return;

    const progressMessage = `📊 My Study Progress Report:

🏆 Overall Progress:
• Tasks Completed: ${userProgress.totalTasksCompleted}/${userProgress.totalTasksAssigned}
• Total Points: ${userProgress.totalPoints}
• Current Streak: ${userProgress.currentStreak} days

🔥 Today's Status:
• Pending Tasks: ${todayTasks.filter(t => !t.completed).length}
• Completed Tasks: ${todayTasks.filter(t => t.completed).length}

🏅 Badges Earned: ${userProgress.badges.length}
${userProgress.badges.map(badge => `${badge.icon} ${badge.name}`).join(', ')}

मुझे और motivation के लिए tips दे सकते हैं?`;

    onSendMessage(progressMessage);
  };

  const handleApplyRecommendation = (recommendation: any) => {
    toast.success(`🎯 Recommendation applied: ${recommendation.title}`);
    console.log('Applied recommendation:', recommendation);
  };

  const handlePersonalizationChange = (settings: any) => {
    console.log('Personalization settings updated:', settings);
  };

  if (!userProgress) return (
    <div className="flex justify-center items-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading progress...</p>
      </div>
    </div>
  );

  const completionPercentage = userProgress.totalTasksAssigned > 0 
    ? Math.round((userProgress.totalTasksCompleted / userProgress.totalTasksAssigned) * 100)
    : 0;

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs p-2">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs p-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs p-2">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs p-2">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">AI Tips</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs p-2">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Progress Overview - Mobile Optimized */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700 text-base sm:text-lg">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                Progress Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-xs">Completion</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{completionPercentage}%</p>
                    <Progress value={completionPercentage} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-3 w-3 text-blue-600" />
                      <span className="font-medium text-xs">Points</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{userProgress.totalPoints}</p>
                    <p className="text-xs text-gray-600">earned</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Flame className="h-3 w-3 text-orange-600" />
                      <span className="font-medium text-xs">Streak</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{userProgress.currentStreak}</p>
                    <p className="text-xs text-gray-600">days</p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Award className="h-3 w-3 text-purple-600" />
                      <span className="font-medium text-xs">Badges</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">{userProgress.badges.length}</p>
                    <p className="text-xs text-gray-600">earned</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={sendProgressToChat} variant="outline" size="sm" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Progress Chat में भेजें
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges Display - Mobile Optimized */}
          {userProgress.badges.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                  Earned Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {userProgress.badges.map((badge) => (
                    <div key={badge.id} className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-xl sm:text-2xl mb-1">{badge.icon}</div>
                      <div className="font-medium text-xs sm:text-sm">{badge.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          {/* Today's Tasks - Mobile Optimized */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                आज के Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">आज कोई tasks नहीं हैं</p>
                  <p className="text-xs text-gray-500 mt-1">कल के tasks के लिए तैयार रहें!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <Card key={task.id} className={`${task.completed ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" size="sm">{task.subject}</Badge>
                            <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} size="sm">
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" size="sm" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getDurationAsNumber(task.duration)}min
                            </Badge>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm sm:text-base">{task.chapter}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{task.topic}</p>
                            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Type: {task.type}
                            </div>
                            {task.completed ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Complete ✓</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => markTaskComplete(task.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete करें
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <EnhancedAnalytics 
            studyPlan={studyPlan}
            examData={examData}
            userProgress={userProgress}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <SmartRecommendations 
            studyPlan={studyPlan}
            examData={examData}
            userProgress={userProgress}
            onApplyRecommendation={handleApplyRecommendation}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <StudyPersonalization 
            onSettingsChange={handlePersonalizationChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressTracker;
