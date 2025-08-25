import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, BookOpen, AlertTriangle, CheckCircle, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { addPointsToUser } from '@/utils/points';
import { useToast } from '@/hooks/use-toast';
import StudyTimer from './StudyTimer';

interface Task {
  id: string;
  subject: string;
  name: string;
  duration: number; // In minutes
  completed: boolean;
  scheduled: Date;
  missed: boolean;
}

const DailyTaskGenerator: React.FC = () => {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [subjects, setSubjects] = useState<{name: string, chapters: number}[]>([
    { name: 'गणित', chapters: 10 },
    { name: 'विज्ञान', chapters: 8 },
  ]);
  const [dailyHours, setDailyHours] = useState(2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showPlanSetup, setShowPlanSetup] = useState(true);
  const [tasksAccepted, setTasksAccepted] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (currentUser) {
      const savedTasks = localStorage.getItem(`${currentUser.uid}_study_tasks`);
      const savedPlan = localStorage.getItem(`${currentUser.uid}_study_plan`);
      const savedTasksAccepted = localStorage.getItem(`${currentUser.uid}_tasks_accepted`);
      
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks);
        } catch (error) {
          console.error('Error parsing saved tasks:', error);
        }
      }
      
      if (savedPlan) {
        try {
          const parsedPlan = JSON.parse(savedPlan);
          setExamName(parsedPlan.examName || '');
          setExamDate(parsedPlan.examDate || '');
          setDailyHours(parsedPlan.dailyHours || 2);
          setSubjects(parsedPlan.subjects || [
            { name: 'गणित', chapters: 10 },
            { name: 'विज्ञान', chapters: 8 },
          ]);
          setShowPlanSetup(false);
        } catch (error) {
          console.error('Error parsing saved plan:', error);
        }
      }
      
      if (savedTasksAccepted === 'true') {
        setTasksAccepted(true);
      }
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (currentUser && tasks.length > 0) {
      localStorage.setItem(`${currentUser.uid}_study_tasks`, JSON.stringify(tasks));
    }
  }, [tasks, currentUser]);
  
  useEffect(() => {
    const checkMissedTasks = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const updatedTasks = tasks.map(task => {
        const taskDate = new Date(task.scheduled);
        taskDate.setHours(0, 0, 0, 0);
        
        if (taskDate < today && !task.completed) {
          return { ...task, missed: true };
        }
        
        return task;
      });
      
      if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
        setTasks(updatedTasks);
      }
    };
    
    checkMissedTasks();
    
    const interval = setInterval(checkMissedTasks, 86400000);
    
    return () => clearInterval(interval);
  }, [tasks]);
  
  const generateStudyPlan = () => {
    if (!examName || !examDate || subjects.length === 0 || dailyHours <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields to generate your study plan.",
        variant: "destructive"
      });
      return;
    }
    
    const planDetails = {
      examName,
      examDate,
      dailyHours,
      subjects
    };
    
    if (currentUser) {
      localStorage.setItem(`${currentUser.uid}_study_plan`, JSON.stringify(planDetails));
    }
    
    const today = new Date();
    const examDay = new Date(examDate);
    const daysLeft = Math.max(1, Math.ceil((examDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    const newTasks: Task[] = [];
    let taskId = 1;
    
    subjects.forEach(subject => {
      const daysForSubject = Math.max(1, Math.floor(daysLeft * (subject.chapters / subjects.reduce((sum, s) => sum + s.chapters, 0))));
      
      for (let i = 0; i < daysForSubject && i < subject.chapters; i++) {
        const taskDate = new Date();
        taskDate.setDate(today.getDate() + Math.floor(i * (daysLeft / daysForSubject)));
        
        newTasks.push({
          id: `task-${taskId++}`,
          subject: subject.name,
          name: `अध्याय ${i + 1}`,
          duration: Math.floor((dailyHours * 60) / subjects.length),
          completed: false,
          scheduled: taskDate,
          missed: false
        });
      }
    });
    
    newTasks.sort((a, b) => new Date(a.scheduled).getTime() - new Date(b.scheduled).getTime());
    
    setTasks(newTasks);
    setShowPlanSetup(false);
    
    toast({
      title: "अध्ययन योजना तैयार!",
      description: `${daysLeft} दिनों के लिए ${newTasks.length} कार्य जनरेट किए गए हैं`
    });
    
    if (currentUser) {
      addPointsToUser(
        currentUser.uid,
        5,
        'activity',
        'अध्ययन योजना बनाई'
      );
    }
  };
  
  const handleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      )
    );
    
    if (currentUser) {
      const completedTasksCount = tasks.filter(t => t.completed).length + 1;
      
      if (completedTasksCount % 3 === 0) {
        addPointsToUser(
          currentUser.uid,
          7,
          'streak',
          `${completedTasksCount} कार्य पूरे किए - स्ट्रीक बोनस!`
        );
        
        toast({
          title: "स्ट्रीक बोनस!",
          description: `${completedTasksCount} कार्य पूरे करने के लिए 7 अतिरिक्त XP मिले!`
        });
      }
    }
  };
  
  const markTaskMissed = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, missed: true } : task
      )
    );
  };
  
  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduled);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && !task.completed;
    });
  };
  
  const getMissedTasks = () => {
    return tasks.filter(task => task.missed && !task.completed);
  };
  
  const getUpcomingTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduled);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today && !task.completed;
    }).slice(0, 3);
  };
  
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('hi-IN', { 
      day: 'numeric', 
      month: 'short'
    });
  };
  
  const resetPlan = () => {
    setShowPlanSetup(true);
    setTasksAccepted(false);
    if (currentUser) {
      localStorage.removeItem(`${currentUser.uid}_study_tasks`);
      localStorage.removeItem(`${currentUser.uid}_tasks_accepted`);
    }
  };
  
  const acceptTasks = () => {
    if (currentUser) {
      localStorage.setItem(`${currentUser.uid}_tasks_accepted`, 'true');
      setTasksAccepted(true);
      
      addPointsToUser(
        currentUser.uid,
        3,
        'activity',
        'अध्ययन योजना स्वीकार की'
      );
      
      toast({
        title: "अध्ययन योजना सक्रिय की गई!",
        description: "आपकी प्रगति अब ट्रैक की जाएगी और अनुस्मारक भेजे जाएंगे"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {showPlanSetup ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <CalendarDays className="h-5 w-5" />
              अध्ययन योजना बनाएं
            </CardTitle>
            <CardDescription>
              अपने परीक्षा के अनुसार दैनिक अध्ययन टास्क जनरेट करें
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examName">परीक्षा का नाम</Label>
              <Input 
                id="examName" 
                value={examName} 
                onChange={(e) => setExamName(e.target.value)}
                placeholder="जैसे: बोर्ड परीक्षा, प्रवेश परीक्षा, आदि"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="examDate">परीक्षा की तारीख</Label>
              <Input 
                id="examDate" 
                type="date" 
                value={examDate} 
                onChange={(e) => setExamDate(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>विषय और अध्याय (अपडेट करें)</Label>
              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={subject.name} 
                      onChange={(e) => {
                        const newSubjects = [...subjects];
                        newSubjects[index].name = e.target.value;
                        setSubjects(newSubjects);
                      }} 
                      placeholder="विषय का नाम"
                      className="flex-1"
                    />
                    <Input 
                      type="number" 
                      value={subject.chapters} 
                      onChange={(e) => {
                        const newSubjects = [...subjects];
                        newSubjects[index].chapters = parseInt(e.target.value) || 1;
                        setSubjects(newSubjects);
                      }} 
                      placeholder="अध्याय" 
                      min="1"
                      className="w-20"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        setSubjects(subjects.filter((_, i) => i !== index));
                      }}
                      className="shrink-0"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSubjects([...subjects, { name: '', chapters: 5 }])}
                className="mt-2"
              >
                विषय जोड़ें
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyHours">दैनिक अध्ययन समय (घंटे)</Label>
              <Input 
                id="dailyHours" 
                type="number" 
                value={dailyHours} 
                onChange={(e) => setDailyHours(parseInt(e.target.value) || 1)} 
                min="1" 
                max="12"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={generateStudyPlan}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              अध्ययन योजना जनरेट करें
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-purple-800 dark:text-purple-300">
              {examName} - अध्ययन योजना
            </h2>
            <Button variant="outline" size="sm" onClick={resetPlan}>
              योजना एडिट करें
            </Button>
          </div>
          
          {!tasksAccepted && (
            <Card className="border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <CardContent className="pt-6 pb-4">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-800/40 flex items-center justify-center">
                    <CalendarDays className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="font-medium text-lg text-purple-800 dark:text-purple-300">
                    आपकी ��ध्ययन योजना तैयार है!
                  </h3>
                  <p className="text-sm text-purple-600/80 dark:text-purple-400">
                    क्या आप इस अध्ययन योजना के साथ आगे बढ़ना चाहते हैं? आपको दैनिक अनुस्मारक और प्रगति ट्रैकिंग मिलेगी।
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button variant="outline" onClick={resetPlan}>
                      योजना बदलें
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      onClick={acceptTasks}
                    >
                      स्वीकार करें
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {getTodaysTasks().length > 0 && tasksAccepted ? (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Clock className="h-4 w-4" />
                आज का अध्ययन कार्य
              </h3>
              
              {getTodaysTasks().map(task => (
                <StudyTimer 
                  key={task.id}
                  taskName={task.name}
                  taskSubject={task.subject}
                  taskDuration={task.duration}
                  taskId={task.id}
                  onComplete={() => handleTaskCompletion(task.id)}
                />
              ))}
            </div>
          ) : tasksAccepted ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <h3 className="text-lg font-medium">आज के सभी कार्य पूरे हो गए हैं!</h3>
                  <p className="text-gray-500 mt-1">अपनी मेहनत के लिए बधाई!</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
          
          {getMissedTasks().length > 0 && tasksAccepted && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-4 w-4" />
                पिछले छूटे हुए कार्य
              </h3>
              
              {getMissedTasks().map(task => (
                <Card key={task.id} className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-orange-600" />
                        <span>{task.subject}</span>
                      </div>
                      <span className="text-xs text-orange-600">{formatDate(task.scheduled)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-orange-600/80">{task.duration} मिनट</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => markTaskMissed(task.id)}
                      >
                        अभी पूरा करें
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {getUpcomingTasks().length > 0 && tasksAccepted && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
                आगामी अध्ययन कार्य
              </h3>
              
              <Card className="border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                <CardContent className="pt-4">
                  <ul className="space-y-3 divide-y divide-blue-100 dark:divide-blue-800/30">
                    {getUpcomingTasks().map(task => (
                      <li key={task.id} className="pt-3 first:pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded">
                              {formatDate(task.scheduled)}
                            </span>
                            <span className="font-medium">{task.subject}</span>
                          </div>
                          <span className="text-sm text-blue-600/80">{task.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyTaskGenerator;
