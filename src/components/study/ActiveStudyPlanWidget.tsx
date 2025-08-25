import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  BookOpen, 
  Target,
  TrendingUp,
  Calendar,
  Star,
  ChevronRight,
  BarChart3,
  Award,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EnhancedPointsSystem } from '@/utils/enhancedPointsSystem';
import DetailedTaskTracker from './DetailedTaskTracker';

interface DailyTask {
  id: string;
  date: string;
  subject: string;
  chapter: string;
  topics: string[];
  subtopics?: string[]; // Added subtopics property
  duration: number;
  completed: boolean;
  notes?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  taskType: 'study' | 'revision' | 'practice' | 'test';
}

interface SavedExamPlan {
  id: string;
  examName: string;
  examDate: string;
  class: string;
  subjects: string[];
  customSubjects: string[];
  dailyHours: number;
  currentStudyStatus: string;
  studyPlan: any;
  examData: any;
  isActive: boolean;
  status: 'active' | 'paused' | 'completed' | 'draft';
  createdAt: string;
  lastModified: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  daysLeft: number;
}

const ActiveStudyPlanWidget: React.FC = () => {
  const [activePlan, setActivePlan] = useState<SavedExamPlan | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [weekProgress, setWeekProgress] = useState(0);
  const [currentWeekTasks, setCurrentWeekTasks] = useState<DailyTask[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadActiveStudyPlan();
    }
  }, [currentUser]);

  const loadActiveStudyPlan = () => {
    if (!currentUser) return;
    
    // Load from new plan management system
    const savedPlans = localStorage.getItem(`study_plans_${currentUser.uid}`);
    if (savedPlans) {
      try {
        const allPlans: SavedExamPlan[] = JSON.parse(savedPlans);
        const activePlans = allPlans.filter(plan => plan.isActive);
        
        if (activePlans.length > 0) {
          // Use the most recently active plan
          const mostRecentPlan = activePlans.reduce((latest, current) => 
            new Date(current.lastModified) > new Date(latest.lastModified) ? current : latest
          );
          
          setActivePlan(mostRecentPlan);
          loadTodayTasks(mostRecentPlan);
          loadCurrentWeekTasks(mostRecentPlan);
          calculateWeekProgress(mostRecentPlan);
        }
      } catch (error) {
        console.error('Error loading active plans:', error);
      }
    }
    
    // Fallback to legacy system
    const legacyPlan = localStorage.getItem(`active_study_plan_${currentUser.uid}`);
    if (legacyPlan && !activePlan) {
      try {
        const plan = JSON.parse(legacyPlan);
        setActivePlan(plan);
        loadTodayTasks(plan);
        loadCurrentWeekTasks(plan);
        calculateWeekProgress(plan);
      } catch (error) {
        console.error('Error loading legacy plan:', error);
      }
    }
  };

  const loadTodayTasks = (plan: SavedExamPlan) => {
    const today = new Date().toISOString().split('T')[0];
    const tasksForToday = plan.studyPlan?.dailySchedule?.filter((task: DailyTask) => task.date === today) || [];
    setTodayTasks(tasksForToday);
  };

  const loadCurrentWeekTasks = (plan: SavedExamPlan) => {
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    const currentWeekTasksList = plan.studyPlan?.dailySchedule?.filter((task: DailyTask) => {
      const taskDate = new Date(task.date);
      return taskDate >= currentWeekStart && taskDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    }) || [];
    
    setCurrentWeekTasks(currentWeekTasksList);
  };

  const calculateWeekProgress = (plan: SavedExamPlan) => {
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    const currentWeekTasksList = plan.studyPlan?.dailySchedule?.filter((task: DailyTask) => {
      const taskDate = new Date(task.date);
      return taskDate >= currentWeekStart && taskDate < new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    }) || [];

    const completedTasks = currentWeekTasksList.filter((task: DailyTask) => task.completed).length;
    const totalTasks = currentWeekTasksList.length;
    
    setWeekProgress(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
  };

  const markTaskComplete = async (taskId: string) => {
    if (!activePlan || !currentUser) return;

    const updatedSchedule = activePlan.studyPlan.dailySchedule.map((task: DailyTask) =>
      task.id === taskId ? { ...task, completed: true } : task
    );

    const completedTask = activePlan.studyPlan.dailySchedule.find((task: DailyTask) => task.id === taskId);
    if (!completedTask) return;

    const completedTasksCount = updatedSchedule.filter((task: DailyTask) => task.completed).length;
    const updatedPlan = {
      ...activePlan,
      studyPlan: {
        ...activePlan.studyPlan,
        dailySchedule: updatedSchedule
      },
      progress: updatedSchedule.length > 0 ? (completedTasksCount / updatedSchedule.length) * 100 : 0,
      completedTasks: completedTasksCount,
      lastModified: new Date().toISOString()
    };

    setActivePlan(updatedPlan);

    // Update in plans array
    const allPlansStr = localStorage.getItem(`study_plans_${currentUser.uid}`);
    if (allPlansStr) {
      const allPlans: SavedExamPlan[] = JSON.parse(allPlansStr);
      const updatedPlans = allPlans.map(plan => 
        plan.id === activePlan.id ? updatedPlan : plan
      );
      localStorage.setItem(`study_plans_${currentUser.uid}`, JSON.stringify(updatedPlans));
    }

    // Award points for task completion
    await EnhancedPointsSystem.awardTaskCompletionPoints(
      currentUser.uid,
      'daily_task',
      {
        subject: completedTask.subject,
        difficulty: completedTask.difficulty === 'easy' ? 'beginner' : 
                   completedTask.difficulty === 'medium' ? 'intermediate' : 'advanced',
        timeSpent: completedTask.duration * 60, // Convert minutes to seconds
        description: `${completedTask.subject}: ${completedTask.chapter} - ${completedTask.topics.join(', ')}`
      }
    );

    // Update today's tasks
    loadTodayTasks(updatedPlan);
    calculateWeekProgress(updatedPlan);

    toast.success('🎉 Task Completed!', {
      description: `${completedTask.subject} का task complete हो गया। Points मिले!`
    });
  };

  const handleManagePlans = () => {
    navigate('/', { state: { openStudyTools: true, activeTab: 'exam-prep' } });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'study': return '📚';
      case 'revision': return '🔄';
      case 'practice': return '✏️';
      case 'test': return '📝';
      default: return '📖';
    }
  };

  if (!activePlan) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Study Plan</h3>
              <p className="text-gray-600 mb-4">
                Create a detailed AI-powered study plan to track your progress
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleManagePlans}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Create Study Plan
                </Button>
                <div className="text-sm text-gray-500">
                  Go to Study Tools → Exam Preparation to create your personalized plan
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = Math.ceil((new Date(activePlan.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const totalTasks = activePlan.studyPlan?.dailySchedule?.length || 0;
  const completedTasks = activePlan.studyPlan?.dailySchedule?.filter((task: DailyTask) => task.completed).length || 0;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Enhanced Active Plan Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Active Study Plan
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="default" className="bg-blue-600">
                {daysLeft > 0 ? `${daysLeft} दिन बचे` : 'Exam Today!'}
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleManagePlans}
                className="border-blue-200 hover:bg-blue-50"
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">{activePlan.examName}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {activePlan.class} • {new Date(activePlan.examDate).toLocaleDateString('hi-IN')}
              </p>
            </div>
            
            {/* Enhanced Progress Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 p-3 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
                  <p className="text-xs text-gray-600">Overall Progress</p>
                  <Progress value={overallProgress} className="mt-1 h-2" />
                </div>
              </div>
              
              <div className="bg-white/70 p-3 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(weekProgress)}%</div>
                  <p className="text-xs text-gray-600">This Week</p>
                  <Progress value={weekProgress} className="mt-1 h-2" />
                </div>
              </div>
              
              <div className="bg-white/70 p-3 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{completedTasks}/{totalTasks}</div>
                  <p className="text-xs text-gray-600">Tasks Done</p>
                </div>
              </div>
            </div>

            {/* Subject Progress */}
            <div>
              <h4 className="font-medium text-sm mb-2">Subject Progress:</h4>
              <div className="grid grid-cols-2 gap-2">
                {activePlan.subjects.map((subject: string) => {
                  const subjectTasks = activePlan.studyPlan?.dailySchedule?.filter((task: DailyTask) => task.subject === subject) || [];
                  const subjectCompleted = subjectTasks.filter((task: DailyTask) => task.completed).length;
                  const subjectProgress = subjectTasks.length > 0 ? (subjectCompleted / subjectTasks.length) * 100 : 0;
                  
                  return (
                    <div key={subject} className="bg-white/50 p-2 rounded text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{subject}</span>
                        <span>{Math.round(subjectProgress)}%</span>
                      </div>
                      <Progress value={subjectProgress} className="h-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabs Layout */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            Detailed
          </TabsTrigger>
          <TabsTrigger value="motivation" className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3" />
            Motivation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {/* Enhanced Today's Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  आज के Tasks ({todayTasks.length})
                </CardTitle>
                {todayTasks.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round((todayTasks.filter(t => t.completed).length / todayTasks.length) * 100)}% Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-green-700 mb-2">Great Job! 🎉</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    आज के लिए कोई tasks नहीं हैं या सब complete हो गए!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayTasks.map(task => (
                    <div key={task.id} className={`p-4 rounded-lg border-l-4 ${
                      task.completed 
                        ? 'bg-green-50 border-l-green-500 dark:bg-green-900/20' 
                        : task.priority === 'high' 
                          ? 'bg-red-50 border-l-red-500 dark:bg-red-900/20'
                          : task.priority === 'medium'
                            ? 'bg-yellow-50 border-l-yellow-500 dark:bg-yellow-900/20'
                            : 'bg-blue-50 border-l-blue-500 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => !task.completed && markTaskComplete(task.id)}
                          className="mt-1 text-lg"
                          disabled={task.completed}
                        >
                          {task.completed ? 
                            <CheckCircle className="h-6 w-6 text-green-500" /> : 
                            <Circle className="h-6 w-6 text-gray-400 hover:text-blue-500" />
                          }
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getTaskTypeIcon(task.taskType)}</span>
                            <h4 className={`font-medium ${task.completed ? 'text-green-700 line-through' : ''}`}>
                              {task.subject}: {task.chapter}
                            </h4>
                            <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                              {task.difficulty}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Topics:</strong> {task.topics.join(', ')}
                            </div>
                            
                            {task.subtopics && task.subtopics.length > 0 && (
                              <div className="text-sm">
                                <strong>Subtopics:</strong> {task.subtopics.join(', ')}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {task.duration} मिनट
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                {task.taskType}
                              </span>
                            </div>
                            
                            {!task.completed && (
                              <div className="bg-blue-50 p-2 rounded text-sm">
                                <strong>Study Method:</strong> {getStudyMethod(task.taskType)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                This Week's Progress ({currentWeekTasks.length} tasks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {currentWeekTasks.filter(t => t.completed).length}
                    </div>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {currentWeekTasks.filter(t => !t.completed && new Date(t.date) <= new Date()).length}
                    </div>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {currentWeekTasks.filter(t => new Date(t.date) > new Date()).length}
                    </div>
                    <p className="text-sm text-gray-600">Upcoming</p>
                  </div>
                </div>
                
                <Progress value={weekProgress} className="h-3" />
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Week Progress: {Math.round(weekProgress)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-4">
          <DetailedTaskTracker />
        </TabsContent>

        <TabsContent value="motivation" className="mt-4">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <Star className="h-10 w-10 mx-auto text-yellow-500" />
                
                <div>
                  <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-3">
                    📸 आज का प्रेरणादायक संदेश
                  </h3>
                  <p className="text-lg text-purple-700 dark:text-purple-300 italic mb-4">
                    सफलता का रहस्य है - हर दिन थोड़ा-थोड़ा सीखते रहना। आप बहुत अच्छा कर रहे हैं!
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-gold-500" />
                      <span className="font-medium">Today's Target</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Complete {todayTasks.filter(t => !t.completed).length} tasks to earn bonus points! 🎯
                    </p>
                  </div>
                  
                  <div className="bg-white/70 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Weekly Goal</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {Math.round(weekProgress)}% complete - Keep going! 💪
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">💡 Smart Study Tips:</h4>
                  <div className="text-left space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>हर 45 मिनट पढ़ने के बाद 15 मिनट का break लें</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>सुबह के समय सबसे कठिन subjects पढ़ें</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>रोज़ revision का समय निकालें - यह बहुत जरूरी है</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  function getStudyMethod(taskType: string): string {
    const methods = {
      study: 'पढ़ें, समझें, और detailed notes बनाएं',
      revision: 'Notes review करें और key points को revise करें',
      practice: 'Practice questions solve करें और concepts को apply करें',
      test: 'Mock test attempt करें और performance analyze करें'
    };
    return methods[taskType] || methods.study;
  }
};

export default ActiveStudyPlanWidget;
