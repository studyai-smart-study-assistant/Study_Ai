
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Target, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StudyPlan, ExamPlanData, DailyTask } from './types';

interface DailyTaskManagerProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
}

const DailyTaskManager: React.FC<DailyTaskManagerProps> = ({
  studyPlan,
  examData
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const subjects = [...new Set(studyPlan.dailyTasks.map(task => task.subject))];
  const taskTypes = [...new Set(studyPlan.dailyTasks.map(task => task.type))];

  const getTasksForDate = (date: string) => {
    return studyPlan.dailyTasks.filter(task => task.date === date);
  };

  const getFilteredTasks = (tasks: DailyTask[]) => {
    return tasks.filter(task => {
      const subjectMatch = filterSubject === 'all' || task.subject === filterSubject;
      const typeMatch = filterType === 'all' || task.type === filterType;
      return subjectMatch && typeMatch;
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const getUpcomingTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return studyPlan.dailyTasks
      .filter(task => task.date >= today && !task.completed)
      .slice(0, 10);
  };

  const getPendingTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return studyPlan.dailyTasks
      .filter(task => task.date < today && !task.completed);
  };

  const getTasksByWeek = () => {
    const weeks: { [week: string]: DailyTask[] } = {};
    studyPlan.dailyTasks.forEach(task => {
      const taskDate = new Date(task.date);
      const weekStart = new Date(taskDate);
      weekStart.setDate(taskDate.getDate() - taskDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(task);
    });
    return weeks;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'important': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="h-4 w-4" />;
      case 'revision': return <Target className="h-4 w-4" />;
      case 'practice': return <AlertCircle className="h-4 w-4" />;
      case 'test': return <CheckCircle2 className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const selectedDateTasks = getTasksForDate(selectedDate);
  const filteredTasks = getFilteredTasks(selectedDateTasks);
  const upcomingTasks = getUpcomingTasks();
  const pendingTasks = getPendingTasks();
  const weeklyTasks = getTasksByWeek();

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Task Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Subject</label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {taskTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Quick Stats</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-green-50 rounded">
                  <div className="font-medium text-green-700">Completed</div>
                  <div className="text-green-600">{studyPlan.dailyTasks.filter(t => t.completed).length}</div>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <div className="font-medium text-orange-700">Pending</div>
                  <div className="text-orange-600">{pendingTasks.length}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {new Date(selectedDate).toLocaleDateString('hi-IN', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>इस दिन के लिए कोई tasks नहीं हैं</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className={`${task.completed ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTypeIcon(task.type)}
                              <Badge variant="outline">{task.subject}</Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge variant="secondary">{task.type}</Badge>
                            </div>
                            <h4 className="font-medium mb-1">{task.chapter}</h4>
                            <p className="text-sm text-gray-600 mb-2">{task.topic}</p>
                            <p className="text-sm text-gray-500">{task.description}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                              <Clock className="h-3 w-3" />
                              {task.duration} min
                            </div>
                            {task.completed ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-300 text-orange-700">
                                Pending
                              </Badge>
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

        {/* Upcoming Tasks */}
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <Card key={task.id} className="border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{new Date(task.date).toLocaleDateString('hi-IN')}</Badge>
                          <Badge variant="outline">{task.subject}</Badge>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{task.chapter} - {task.topic}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.duration} min
                        </div>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(task.type)}
                          {task.type}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tasks */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Tasks ({pendingTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
                  <p>बहुत बढ़िया! कोई pending tasks नहीं हैं</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <Card key={task.id} className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">{new Date(task.date).toLocaleDateString('hi-IN')}</Badge>
                            <Badge variant="outline">{task.subject}</Badge>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-orange-800">{task.chapter} - {task.topic}</h4>
                        <p className="text-sm text-orange-700 mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-orange-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.duration} min
                          </div>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(task.type)}
                            {task.type}
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

        {/* Weekly View */}
        <TabsContent value="weekly">
          <div className="space-y-4">
            {Object.entries(weeklyTasks)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(0, 4)
              .map(([weekStart, tasks]) => {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const completedCount = tasks.filter(t => t.completed).length;
                const totalCount = tasks.length;
                const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <Card key={weekStart}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {new Date(weekStart).toLocaleDateString('hi-IN')} - {weekEnd.toLocaleDateString('hi-IN')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{completedCount}/{totalCount} tasks</Badge>
                          <Badge variant={completionPercentage >= 80 ? 'default' : completionPercentage >= 50 ? 'secondary' : 'destructive'}>
                            {completionPercentage}%
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tasks.slice(0, 6).map((task) => (
                          <div key={task.id} className={`p-3 border rounded-lg ${task.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{task.subject}</Badge>
                              {task.completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                            </div>
                            <div className="font-medium text-sm">{task.chapter}</div>
                            <div className="text-xs text-gray-600">{task.topic}</div>
                            <div className="text-xs text-gray-500 mt-1">{task.duration} min • {task.type}</div>
                          </div>
                        ))}
                      </div>
                      {tasks.length > 6 && (
                        <p className="text-sm text-gray-500 mt-3 text-center">
                          और {tasks.length - 6} tasks...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyTaskManager;
