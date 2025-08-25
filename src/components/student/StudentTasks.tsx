import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Trash2, 
  Star,
  ChevronDown,
  ChevronUp,
  ListCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { addPointsToUser } from '@/utils/points';
import { EnhancedPointsSystem } from '@/utils/enhancedPointsSystem';

interface StudentTasksProps {
  studentPoints: number;
  setStudentPoints: (points: number) => void;
  studentLevel: number;
  setStudentLevel: (level: number) => void;
  currentUser: any;
}

interface Task {
  id: string;
  text: string;
  points: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: string;
  category: string;
}

const StudentTasks: React.FC<StudentTasksProps> = ({ 
  studentPoints, 
  setStudentPoints,
  studentLevel,
  setStudentLevel,
  currentUser 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(5);
  const [newTaskCategory, setNewTaskCategory] = useState('study');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [groupedTasks, setGroupedTasks] = useState<Record<string, Task[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (currentUser) {
      // Load tasks from localStorage
      const savedTasks = localStorage.getItem(`${currentUser.uid}_tasks`);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        // Add default tasks if no tasks exist
        const defaultTasks = [
          {
            id: "default1",
            text: "अध्ययन के लिए दैनिक समय निकालें",
            points: 5,
            priority: "medium" as const,
            completed: false,
            category: "study"
          },
          {
            id: "default2",
            text: "टैक्स फॉर्म भरें",
            points: 10,
            priority: "high" as const,
            completed: false,
            category: "homework"
          }
        ];
        setTasks(defaultTasks);
        localStorage.setItem(`${currentUser.uid}_tasks`, JSON.stringify(defaultTasks));
      }
    }
  }, [currentUser]);
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (currentUser && tasks.length > 0) {
      localStorage.setItem(`${currentUser.uid}_tasks`, JSON.stringify(tasks));
    }
  }, [tasks, currentUser]);
  
  // Group tasks by category
  useEffect(() => {
    const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const category = task.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      return acc;
    }, {});
    
    setGroupedTasks(grouped);
    
    // Initialize expanded state for new categories
    const newExpandedState = {...expandedCategories};
    Object.keys(grouped).forEach(category => {
      if (newExpandedState[category] === undefined) {
        newExpandedState[category] = true;
      }
    });
    setExpandedCategories(newExpandedState);
  }, [tasks, expandedCategories]);
  
  const addTask = () => {
    if (!newTaskText.trim()) {
      toast.error('कृपया कार्य का विवरण दर्ज करें');
      return;
    }
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      points: newTaskPoints,
      priority: newTaskPriority,
      completed: false,
      dueDate: newTaskDueDate || undefined,
      category: newTaskCategory
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setNewTaskPoints(5);
    setNewTaskDueDate('');
    setNewTaskPriority('medium');
    
    toast.success('नया कार्य जोड़ा गया');
  };
  
  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId && !task.completed) {
        return {...task, completed: true};
      }
      return task;
    });
    
    const completedTask = tasks.find(task => task.id === taskId);
    if (completedTask && !completedTask.completed && currentUser) {
      try {
        // Use enhanced points system for task completion
        const pointsAwarded = await EnhancedPointsSystem.awardTaskCompletionPoints(
          currentUser.uid,
          'daily_task',
          {
            description: completedTask.text,
            subject: completedTask.category === 'study' ? 'सामान्य अध्ययन' : 
                    completedTask.category === 'homework' ? 'होमवर्क' : 
                    completedTask.category === 'test' ? 'परीक्षा' : 
                    completedTask.category === 'project' ? 'प्रोजेक्ट' : 'अन्य',
            timeSpent: 300 // Assume 5 minutes per task
          }
        );

        // Reload points after awarding
        const points = localStorage.getItem(`${currentUser.uid}_points`);
        const level = localStorage.getItem(`${currentUser.uid}_level`);
        setStudentPoints(points ? parseInt(points) : 0);
        setStudentLevel(level ? parseInt(level) : 1);
        
        toast.success(`कार्य पूरा! +${pointsAwarded} पॉइंट्स मिले`);
      } catch (error) {
        console.error("Error awarding enhanced points:", error);
        toast.error('पॉइंट्स देने में त्रुटि');
      }
    }
    
    setTasks(updatedTasks);
  };
  
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success('कार्य हटा दिया गया');
  };
  
  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };
  
  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-green-500';
      default: return '';
    }
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'study': return 'अध्ययन';
      case 'homework': return 'होमवर्क';
      case 'test': return 'परीक्षा';
      case 'project': return 'प्रोजेक्ट';
      case 'other': return 'अन्य';
      default: return category;
    }
  };
  
  return (
    <CardContent className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ListCheck className="h-5 w-5 text-purple-600" />
            दैनिक कार्य सूची
          </h3>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {tasks.filter(t => !t.completed).length} बाकी
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <Input
            placeholder="नया कार्य जोड़ें..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md border text-sm"
            >
              <option value="study">अध्ययन</option>
              <option value="homework">होमवर्क</option>
              <option value="test">परीक्षा</option>
              <option value="project">प्रोजेक्ट</option>
              <option value="other">अन्य</option>
            </select>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md border text-sm"
            >
              <option value="low">कम प्राथमिकता</option>
              <option value="medium">मध्यम प्राथमिकता</option>
              <option value="high">उच्च प्राथमिकता</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="पॉइंट्स"
              min={1}
              max={50}
              value={newTaskPoints}
              onChange={(e) => setNewTaskPoints(parseInt(e.target.value) || 5)}
              className="w-20"
            />
            <Input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addTask} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {Object.keys(groupedTasks).length > 0 ? (
            Object.entries(groupedTasks).map(([category, categoryTasks]) => (
              <div key={category} className="border rounded-md overflow-hidden">
                <div 
                  className="bg-purple-50 dark:bg-purple-900/20 p-2 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  <h4 className="font-medium text-sm">{getCategoryLabel(category)}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                      {categoryTasks.filter(t => !t.completed).length}/{categoryTasks.length}
                    </Badge>
                    {expandedCategories[category] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                {expandedCategories[category] && (
                  <div className="divide-y">
                    {categoryTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`flex items-start gap-3 p-3 ${
                          task.completed 
                            ? 'bg-green-50 dark:bg-green-900/10 line-through text-gray-500'
                            : ''
                        }`}
                      >
                        <Checkbox 
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          disabled={task.completed}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.text}</p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs flex items-center ${getPriorityColor(task.priority)}`}>
                                <Star className="h-3 w-3 mr-0.5" />
                                {task.priority === 'high' ? 'उच्च' : task.priority === 'medium' ? 'मध्यम' : 'कम'}
                              </span>
                              <span className="text-xs flex items-center text-purple-600">
                                <CheckSquare className="h-3 w-3 mr-0.5" />
                                {task.points} पॉइंट्स
                              </span>
                            </div>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-0.5" />
                                {new Date(task.dueDate).toLocaleDateString('hi-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-gray-500 hover:text-red-500"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>कोई कार्य नहीं मिला। अपना पहला कार्य जोड़ें!</p>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );
};

export default StudentTasks;
