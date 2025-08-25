
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  Brain,
  FileText,
  HelpCircle,
  Target,
  Zap
} from 'lucide-react';
import { StudyPlan, ExamPlanData } from '../types';

interface TodaysDashboardProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  onStartQuiz: (topic: string) => void;
  onGenerateNotes: (topic: string) => void;
  onStartTeaching: (topic: string) => void;
}

const TodaysDashboard: React.FC<TodaysDashboardProps> = ({
  studyPlan,
  examData,
  onStartQuiz,
  onGenerateNotes,
  onStartTeaching
}) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('hi-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTodaysTasks = () => {
    const today = new Date().getDay();
    const dayNames = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const todayName = dayNames[today];
    
    // Filter tasks based on day if available, otherwise return first few tasks
    return studyPlan.dailyTasks?.filter(task => 
      task.day === todayName || !task.day
    ).slice(0, 5) || [];
  };

  const toggleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'उच्च':
        return 'destructive';
      case 'important':
      case 'मध्यम':
        return 'default';
      case 'normal':
      case 'सामान्य':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'उच्च';
      case 'important':
        return 'मध्यम';
      case 'normal':
        return 'सामान्य';
      default:
        return priority;
    }
  };

  const todaysTasks = getTodaysTasks();
  const completedCount = todaysTasks.filter(task => 
    completedTasks.includes(`${task.subject}-${task.topics?.[0] || task.topic}`)
  ).length;

  const progressPercent = todaysTasks.length > 0 
    ? Math.round((completedCount / todaysTasks.length) * 100)
    : 0;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg text-blue-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">आज का अध्ययन कार्यक्रम</span>
            <span className="sm:hidden">आज का प्लान</span>
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-white/80 text-xs px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {progressPercent}% पूरा
            </Badge>
            <Badge className="bg-green-600 text-white text-xs px-2 py-1">
              {completedCount}/{todaysTasks.length}
            </Badge>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-blue-700 mt-1">
          {getCurrentDate()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {todaysTasks.length === 0 ? (
          <div className="text-center py-4 text-gray-600">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">आज कोई विशेष कार्य नहीं है</p>
            <p className="text-xs text-gray-500 mt-1">अपना समय revision में लगाएं</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysTasks.map((task, index) => {
              const taskId = `${task.subject}-${task.topics?.[0] || task.topic}`;
              const isCompleted = completedTasks.includes(taskId);
              const topicsList = task.topics || [task.topic];
              
              return (
                <Card key={index} className={`border transition-all ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mt-1"
                        onClick={() => toggleTaskComplete(taskId)}
                      >
                        <CheckCircle className={`h-4 w-4 ${
                          isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </Button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.subject} - {topicsList.join(', ')}
                          </h4>
                          <div className="flex gap-1">
                            <Badge 
                              variant={getPriorityVariant(task.priority)}
                              className="text-xs px-2 py-0"
                            >
                              {getPriorityText(task.priority)}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {task.duration}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600">
                          प्रकार: {task.type === 'study' ? 'अध्ययन' : 
                                   task.type === 'revision' ? 'पुनरावलोकन' :
                                   task.type === 'practice' ? 'अभ्यास' : 'परीक्षा'}
                        </p>
                        
                        {!isCompleted && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => onStartQuiz(topicsList[0])}
                            >
                              <HelpCircle className="h-3 w-3 mr-1" />
                              क्विज़
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => onGenerateNotes(topicsList[0])}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              नोट्स
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => onStartTeaching(topicsList[0])}
                            >
                              <Brain className="h-3 w-3 mr-1" />
                              टीचर
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {todaysTasks.length > 0 && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                आज की प्रगति
              </span>
              <span className="text-sm text-blue-600">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">
              {completedCount === todaysTasks.length 
                ? "🎉 बधाई हो! आज का पूरा कार्य पूरा हो गया!" 
                : `${todaysTasks.length - completedCount} कार्य बचे हैं`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysDashboard;
