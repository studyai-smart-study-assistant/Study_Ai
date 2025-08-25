import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trophy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudentGoalsProps {
  studentPoints: number;
  setStudentPoints: (points: number) => void;
  studentLevel: number;
  setStudentLevel: (level: number) => void;
  currentUser: any;
}

interface Goal {
  id: string;
  text: string;
  points: number;
  completed: boolean;
  deadline?: string;
}

const StudentGoals: React.FC<StudentGoalsProps> = ({ 
  studentPoints, 
  setStudentPoints,
  studentLevel,
  setStudentLevel,
  currentUser 
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalPoints, setNewGoalPoints] = useState(10);
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  
  useEffect(() => {
    if (currentUser) {
      // Load goals from localStorage
      const savedGoals = localStorage.getItem(`${currentUser.uid}_goals`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    }
  }, [currentUser]);
  
  // Save goals to localStorage whenever they change
  useEffect(() => {
    if (currentUser && goals.length > 0) {
      localStorage.setItem(`${currentUser.uid}_goals`, JSON.stringify(goals));
    }
  }, [goals, currentUser]);
  
  const addGoal = () => {
    if (!newGoalText.trim()) {
      toast.error('कृपया लक्ष्य का विवरण दर्ज करें');
      return;
    }
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: newGoalText,
      points: newGoalPoints,
      completed: false,
      deadline: newGoalDeadline || undefined
    };
    
    setGoals([...goals, newGoal]);
    setNewGoalText('');
    setNewGoalPoints(10);
    setNewGoalDeadline('');
    
    toast.success('नया लक्ष्य जोड़ा गया');
  };
  
  const toggleGoalCompletion = (goalId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId && !goal.completed) {
        // Award points only when completing the goal
        const points = studentPoints + goal.points;
        setStudentPoints(points);
        localStorage.setItem(`${currentUser.uid}_points`, points.toString());
        
        // Check if level up is needed
        const newLevel = Math.floor(points / 100) + 1;
        if (newLevel > studentLevel) {
          setStudentLevel(newLevel);
          localStorage.setItem(`${currentUser.uid}_level`, newLevel.toString());
          toast.success(`बधाई हो! आप लेवल ${newLevel} पर पहुंच गए हैं`, { duration: 5000 });
        }
        
        // Add to points history
        const history = JSON.parse(localStorage.getItem(`${currentUser.uid}_points_history`) || '[]');
        history.push({
          id: Date.now(),
          type: 'goal',
          points: goal.points,
          description: `लक्ष्य पूरा: ${goal.text}`,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem(`${currentUser.uid}_points_history`, JSON.stringify(history));
        
        toast.success(`लक्ष्य पूरा! +${goal.points} पॉइंट्स मिले`);
        
        return {...goal, completed: true};
      }
      return goal;
    });
    
    setGoals(updatedGoals);
  };
  
  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
    toast.success('लक्ष्य हटा दिया गया');
  };
  
  return (
    <CardContent className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            मेरे लक्ष्य
          </h3>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {goals.filter(g => !g.completed).length} सक्रिय
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <Input
            placeholder="नया लक्ष्य जोड़ें..."
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="पॉइंट्स"
              min={5}
              max={100}
              value={newGoalPoints}
              onChange={(e) => setNewGoalPoints(parseInt(e.target.value) || 10)}
              className="w-24"
            />
            <Input
              type="date"
              value={newGoalDeadline}
              onChange={(e) => setNewGoalDeadline(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addGoal} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {goals.length > 0 ? (
            goals.map(goal => (
              <div 
                key={goal.id} 
                className={`flex items-start gap-3 p-3 rounded-md ${
                  goal.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 line-through text-gray-500' 
                    : 'bg-purple-50 dark:bg-purple-900/20'
                }`}
              >
                <Checkbox 
                  checked={goal.completed}
                  onCheckedChange={() => toggleGoalCompletion(goal.id)}
                  disabled={goal.completed}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{goal.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center">
                      <Trophy className="h-3.5 w-3.5 text-amber-500 mr-1" />
                      <span className="text-xs font-medium">{goal.points} पॉइंट्स</span>
                    </div>
                    {goal.deadline && (
                      <span className="text-xs text-gray-500">
                        समय सीमा: {new Date(goal.deadline).toLocaleDateString('hi-IN')}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-500 hover:text-red-500"
                  onClick={() => deleteGoal(goal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Target className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>कोई लक्ष्य नहीं मिला। अपना पहला लक्ष्य सेट करें!</p>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );
};

export default StudentGoals;
