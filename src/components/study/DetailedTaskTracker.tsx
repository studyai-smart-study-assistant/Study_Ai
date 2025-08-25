import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Award,
  Brain,
  AlertCircle,
  Timer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EnhancedPointsSystem } from '@/utils/enhancedPointsSystem';

interface DetailedTask {
  id: string;
  date: string;
  subject: string;
  chapter: string;
  topics: string[];
  subtopics: string[];
  duration: number;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  taskType: 'study' | 'revision' | 'practice' | 'test';
  progress: number; // 0-100
  timeSpent: number; // in minutes
  weeklyQuizScheduled?: boolean;
}

interface WeeklyProgress {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  totalTimeSpent: number;
  subjects: { [key: string]: number };
  quizCompleted: boolean;
}

const DetailedTaskTracker: React.FC = () => {
  const [currentWeekTasks, setCurrentWeekTasks] = useState<DetailedTask[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [selectedTask, setSelectedTask] = useState<DetailedTask | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadCurrentWeekData();
    }
  }, [currentUser]);

  const loadCurrentWeekData = () => {
    const activePlan = localStorage.getItem(`active_study_plan_${currentUser?.uid}`);
    if (!activePlan) return;

    const plan = JSON.parse(activePlan);
    const currentWeek = getCurrentWeek();
    
    // Load current week tasks
    const weekTasks = plan.dailySchedule?.filter((task: any) => {
      const taskDate = new Date(task.date);
      return isInCurrentWeek(taskDate);
    }) || [];
    
    setCurrentWeekTasks(weekTasks);
    calculateWeeklyProgress(weekTasks);
  };

  const getCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    return startOfWeek;
  };

  const isInCurrentWeek = (date: Date) => {
    const startOfWeek = getCurrentWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return date >= startOfWeek && date <= endOfWeek;
  };

  const calculateWeeklyProgress = (tasks: DetailedTask[]) => {
    const startOfWeek = getCurrentWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTimeSpent = tasks.reduce((total, task) => total + (task.timeSpent || 0), 0);
    
    const subjectProgress: { [key: string]: number } = {};
    tasks.forEach(task => {
      if (!subjectProgress[task.subject]) {
        subjectProgress[task.subject] = 0;
      }
      if (task.completed) {
        subjectProgress[task.subject]++;
      }
    });

    const progress: WeeklyProgress = {
      weekNumber: Math.ceil((Date.now() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      totalTasks: tasks.length,
      completedTasks,
      totalTimeSpent,
      subjects: subjectProgress,
      quizCompleted: false // TODO: Check quiz completion
    };

    setWeeklyProgress(progress);
  };

  const updateTaskProgress = async (taskId: string, progress: number, timeSpent: number, notes?: string) => {
    if (!currentUser) return;

    setIsUpdatingProgress(true);
    try {
      const activePlan = localStorage.getItem(`active_study_plan_${currentUser.uid}`);
      if (!activePlan) return;

      const plan = JSON.parse(activePlan);
      const updatedSchedule = plan.dailySchedule.map((task: any) => {
        if (task.id === taskId) {
          return {
            ...task,
            progress,
            timeSpent: (task.timeSpent || 0) + timeSpent,
            completed: progress >= 100,
            completedAt: progress >= 100 ? new Date().toISOString() : task.completedAt,
            notes: notes || task.notes
          };
        }
        return task;
      });

      const updatedPlan = {
        ...plan,
        dailySchedule: updatedSchedule,
        progress: (updatedSchedule.filter((task: any) => task.completed).length / updatedSchedule.length) * 100
      };

      localStorage.setItem(`active_study_plan_${currentUser.uid}`, JSON.stringify(updatedPlan));

      // Update in main plans array
      const allPlans = localStorage.getItem(`advanced_exam_plans_${currentUser.uid}`);
      if (allPlans) {
        const plans = JSON.parse(allPlans);
        const updatedPlans = plans.map((p: any) => 
          p.id === plan.id ? updatedPlan : p
        );
        localStorage.setItem(`advanced_exam_plans_${currentUser.uid}`, JSON.stringify(updatedPlans));
      }

      // Award points - Fixed to use 'task' instead of 'detailed_task'
      const task = plan.dailySchedule.find((t: any) => t.id === taskId);
      if (task && progress >= 100) {
        await EnhancedPointsSystem.awardTaskCompletionPoints(
          currentUser.uid,
          'daily_task',
          {
            subject: task.subject,
            difficulty: task.difficulty === 'easy' ? 'beginner' : 
                       task.difficulty === 'medium' ? 'intermediate' : 'advanced',
            timeSpent: timeSpent * 60,
            description: `${task.subject}: ${task.chapter} - ${task.topics.join(', ')}`
          }
        );
      }

      loadCurrentWeekData();
      toast.success(progress >= 100 ? '🎉 Task Completed!' : '📈 Progress Updated!');
      
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Progress update में error');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const generateWeeklyQuiz = async () => {
    if (!currentUser || !weeklyProgress) return;

    // Create quiz based on week's completed topics
    const completedTasks = currentWeekTasks.filter(task => task.completed);
    const subjects = [...new Set(completedTasks.map(task => task.subject))];
    const topics = completedTasks.flatMap(task => task.topics);

    const quizData = {
      title: `Week ${weeklyProgress.weekNumber} Quiz`,
      subjects: subjects,
      topics: topics,
      difficulty: 'mixed',
      questionCount: Math.min(topics.length * 2, 20),
      timeLimit: 30
    };

    // Store quiz data for Interactive Quiz component
    localStorage.setItem(`weekly_quiz_${currentUser.uid}`, JSON.stringify(quizData));
    
    toast.success('📝 Weekly Quiz Generated!', {
      description: 'Quiz ready ho gaya hai। Interactive Quiz section में जाकर attempt करें।'
    });
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

  if (!weeklyProgress) {
    return (
      <div className="text-center py-8">
        <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">कोई active study plan नहीं मिला</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Week {weeklyProgress.weekNumber} Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {weeklyProgress.completedTasks}/{weeklyProgress.totalTasks}
              </div>
              <p className="text-sm text-gray-600">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((weeklyProgress.completedTasks / weeklyProgress.totalTasks) * 100)}%
              </div>
              <p className="text-sm text-gray-600">Weekly Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(weeklyProgress.totalTimeSpent / 60)}h {weeklyProgress.totalTimeSpent % 60}m
              </div>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
            <div className="text-center">
              <Button
                onClick={generateWeeklyQuiz}
                disabled={weeklyProgress.completedTasks === 0}
                className="w-full"
                variant={weeklyProgress.quizCompleted ? "secondary" : "default"}
              >
                {weeklyProgress.quizCompleted ? "Quiz Completed ✅" : "📝 Generate Quiz"}
              </Button>
            </div>
          </div>

          {/* Subject-wise Progress */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Subject-wise Progress:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(weeklyProgress.subjects).map(([subject, count]) => (
                <div key={subject} className="bg-white p-2 rounded border">
                  <div className="font-medium text-sm">{subject}</div>
                  <div className="text-xs text-gray-600">{count} tasks completed</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            This Week's Detailed Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentWeekTasks.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">इस हफ्ते के लिए कोई tasks नहीं हैं</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentWeekTasks.map(task => (
                <Card key={task.id} className={`border-l-4 ${
                  task.completed ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10' : 
                  task.progress > 0 ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {task.completed ? 
                            <CheckCircle className="h-5 w-5 text-green-500" /> : 
                            <Circle className="h-5 w-5 text-gray-400" />
                          }
                          <h4 className="font-medium">{task.subject}: {task.chapter}</h4>
                          <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>

                        <div className="ml-7 space-y-2">
                          <div className="text-sm">
                            <strong>Topics:</strong> {task.topics.join(', ')}
                          </div>
                          
                          {task.subtopics && task.subtopics.length > 0 && (
                            <div className="text-sm">
                              <strong>Subtopics:</strong> {task.subtopics.join(', ')}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {task.duration} मिनट planned
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              {task.timeSpent || 0} मिनट spent
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>

                          {/* Task Notes */}
                          {task.notes && (
                            <div className="bg-gray-50 p-2 rounded text-sm">
                              <strong>Notes:</strong> {task.notes}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTask(task)}
                              disabled={task.completed}
                            >
                              Update Progress
                            </Button>
                            {task.completed && (
                              <Badge variant="default" className="bg-green-600">
                                ✅ Completed on {new Date(task.completedAt!).toLocaleDateString('hi-IN')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Progress Update Modal */}
      {selectedTask && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Update Progress: {selectedTask.subject}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">{selectedTask.chapter}</h4>
              <p className="text-sm text-gray-600">Topics: {selectedTask.topics.join(', ')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Progress: {selectedTask.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedTask.progress}
                onChange={(e) => setSelectedTask({
                  ...selectedTask,
                  progress: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Time Spent (minutes):
              </label>
              <input
                type="number"
                min="0"
                max="300"
                defaultValue={0}
                onChange={(e) => setSelectedTask({
                  ...selectedTask,
                  timeSpent: (selectedTask.timeSpent || 0) + parseInt(e.target.value || '0')
                })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (Optional):
              </label>
              <Textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="आज क्या पढ़ा, कैसा लगा, कोई difficulty..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  updateTaskProgress(
                    selectedTask.id,
                    selectedTask.progress,
                    0, // Time will be added from input
                    taskNotes
                  );
                  setSelectedTask(null);
                  setTaskNotes('');
                }}
                disabled={isUpdatingProgress}
                className="flex-1"
              >
                {isUpdatingProgress ? 'Updating...' : 'Update Progress'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedTask(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailedTaskTracker;
