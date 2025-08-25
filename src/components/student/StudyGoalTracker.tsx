import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { addPointsToUser } from '@/utils/points';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  completed: boolean;
  createdAt: string;
}

interface StudyGoalTrackerProps {
  currentUser: any;
}

const StudyGoalTracker: React.FC<StudyGoalTrackerProps> = ({ currentUser }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(60);
  
  useEffect(() => {
    if (currentUser) {
      loadGoals();
    }
  }, [currentUser]);
  
  const loadGoals = () => {
    const savedGoals = localStorage.getItem(`${currentUser.uid}_study_goals`);
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  };
  
  const saveGoals = (updatedGoals: Goal[]) => {
    localStorage.setItem(`${currentUser.uid}_study_goals`, JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };
  
  const addGoal = () => {
    if (!newGoalTitle.trim()) {
      toast.error('कृपया लक्ष्य का शीर्षक दर्ज करें');
      return;
    }
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      target: newGoalTarget,
      current: 0,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
    
    // Reset form
    setNewGoalTitle('');
    setNewGoalTarget(60);
    setIsAdding(false);
    
    toast.success('नया अध्ययन लक्ष्य जोड़ा गया');
  };
  
  const updateGoalProgress = (goalId: string, minutes: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newCurrent = Math.min(goal.current + minutes, goal.target);
        const wasCompleted = goal.completed;
        const isNowCompleted = newCurrent >= goal.target;
        
        // Award points if goal was just completed
        if (!wasCompleted && isNowCompleted && currentUser) {
          addPointsToUser(
            currentUser.uid,
            25,
            'achievement',
            `अध्ययन लक्ष्य पूरा किया: ${goal.title}`
          );
        }
        
        return {
          ...goal,
          current: newCurrent,
          completed: isNowCompleted
        };
      }
      return goal;
    });
    
    saveGoals(updatedGoals);
  };
  
  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
    toast.success('लक्ष्य हटा दिया गया');
  };
  
  return (
    <CardContent className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            अध्ययन लक्ष्य
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1"
            disabled={isAdding}
          >
            <Plus className="h-4 w-4" />
            नया लक्ष्य
          </Button>
        </div>
        
        {isAdding && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">नया अध्ययन लक्ष्य</h4>
            
            <div className="space-y-2">
              <Label htmlFor="goal-title">लक्ष्य का शीर्षक</Label>
              <Input 
                id="goal-title" 
                placeholder="उदाहरण: गणित के 5 अध्याय पढ़ना"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goal-target">लक्ष्य समय (मिनट)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="goal-target" 
                  type="number"
                  min={1}
                  max={1000}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                />
                <span className="text-sm text-gray-500">मिनट</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                रद्द करें
              </Button>
              <Button 
                size="sm"
                onClick={addGoal}
              >
                जोड़ें
              </Button>
            </div>
          </div>
        )}
        
        {goals.length === 0 && !isAdding ? (
          <div className="text-center py-6 text-gray-500">
            <Target className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>कोई अध्ययन लक्ष्य नहीं मिला</p>
            <p className="text-sm">शुरू करने के लिए "नया लक्ष्य" बटन पर क्लिक करें</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <div 
                key={goal.id} 
                className={`p-3 rounded-lg ${goal.completed 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-indigo-50 dark:bg-indigo-900/20'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {goal.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Target className="h-5 w-5 text-indigo-500" />
                    )}
                    <span className="font-medium">{goal.title}</span>
                  </div>
                  <Badge variant={goal.completed ? "secondary" : "outline"}>
                    {goal.current}/{goal.target} मिनट
                  </Badge>
                </div>
                
                <Progress 
                  value={(goal.current / goal.target) * 100} 
                  className="h-2 mb-2"
                />
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 px-2 text-xs border-gray-200"
                      onClick={() => updateGoalProgress(goal.id, 15)}
                      disabled={goal.completed}
                    >
                      +15m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 px-2 text-xs border-gray-200"
                      onClick={() => updateGoalProgress(goal.id, 30)}
                      disabled={goal.completed}
                    >
                      +30m
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default StudyGoalTracker;
