import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Calendar, 
  Target, 
  Settings, 
  Trash2, 
  Play, 
  Pause, 
  Edit3,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { StudyPlan, ExamPlanData } from './types';

interface SavedExamPlan {
  id: string;
  examName: string;
  examDate: string;
  class: string;
  subjects: string[];
  customSubjects: string[];
  dailyHours: number;
  currentStudyStatus: string;
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  isActive: boolean;
  status: 'active' | 'paused' | 'completed' | 'draft';
  createdAt: string;
  lastModified: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  daysLeft: number;
}

interface PlanManagementSystemProps {
  onCreateNew: () => void;
  onSelectPlan: (plan: SavedExamPlan) => void;
}

const PlanManagementSystem: React.FC<PlanManagementSystemProps> = ({
  onCreateNew,
  onSelectPlan
}) => {
  const { currentUser } = useAuth();
  const [savedPlans, setSavedPlans] = useState<SavedExamPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SavedExamPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<SavedExamPlan | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadSavedPlans();
    }
  }, [currentUser]);

  const loadSavedPlans = () => {
    if (!currentUser) return;
    
    const saved = localStorage.getItem(`study_plans_${currentUser.uid}`);
    if (saved) {
      try {
        const plans: SavedExamPlan[] = JSON.parse(saved);
        // Update days left for each plan
        const updatedPlans = plans.map(plan => ({
          ...plan,
          daysLeft: Math.ceil((new Date(plan.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }));
        setSavedPlans(updatedPlans);
      } catch (error) {
        console.error('Error loading saved plans:', error);
      }
    }
  };

  const savePlansToStorage = (plans: SavedExamPlan[]) => {
    if (!currentUser) return;
    localStorage.setItem(`study_plans_${currentUser.uid}`, JSON.stringify(plans));
  };

  const togglePlanStatus = (planId: string) => {
    const updatedPlans = savedPlans.map(plan => {
      if (plan.id === planId) {
        const newStatus = plan.isActive ? 'paused' : 'active';
        return {
          ...plan,
          isActive: !plan.isActive,
          status: newStatus as 'active' | 'paused',
          lastModified: new Date().toISOString()
        };
      }
      return plan;
    });
    
    setSavedPlans(updatedPlans);
    savePlansToStorage(updatedPlans);
    
    const plan = updatedPlans.find(p => p.id === planId);
    toast.success(
      plan?.isActive 
        ? `📚 "${plan.examName}" plan activated!` 
        : `⏸️ "${plan?.examName}" plan paused!`
    );
  };

  const deletePlan = (planId: string) => {
    const planToDelete = savedPlans.find(p => p.id === planId);
    const updatedPlans = savedPlans.filter(plan => plan.id !== planId);
    setSavedPlans(updatedPlans);
    savePlansToStorage(updatedPlans);
    
    toast.success(`🗑️ "${planToDelete?.examName}" plan deleted!`);
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-100 text-gray-700';
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLevel = (daysLeft: number) => {
    if (daysLeft <= 7) return { label: 'Urgent', color: 'bg-red-100 text-red-800' };
    if (daysLeft <= 30) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    if (daysLeft <= 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-green-100 text-green-800' };
  };

  const activePlans = savedPlans.filter(plan => plan.isActive);
  const inactivePlans = savedPlans.filter(plan => !plan.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Target className="h-5 w-5" />
              Study Plan Management
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                {savedPlans.length} Plans
              </Badge>
            </CardTitle>
            <Button onClick={onCreateNew} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{activePlans.length}</div>
              <p className="text-sm text-gray-600">Active Plans</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{inactivePlans.length}</div>
              <p className="text-sm text-gray-600">Paused Plans</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {savedPlans.filter(p => p.status === 'completed').length}
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(savedPlans.reduce((acc, plan) => acc + plan.progress, 0) / (savedPlans.length || 1))}%
              </div>
              <p className="text-sm text-gray-600">Avg Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Plans ({activePlans.length})</TabsTrigger>
          <TabsTrigger value="inactive">All Plans ({savedPlans.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({savedPlans.filter(p => p.status === 'completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activePlans.length === 0 ? (
            <Card className="text-center p-8">
              <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Plans</h3>
              <p className="text-gray-600 mb-4">Create a new study plan to get started</p>
              <Button onClick={onCreateNew} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Plan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePlans.map(plan => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  onToggleStatus={togglePlanStatus}
                  onDelete={deletePlan}
                  onSelect={onSelectPlan}
                  onView={setViewingPlan}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPlans.map(plan => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                onToggleStatus={togglePlanStatus}
                onDelete={deletePlan}
                onSelect={onSelectPlan}
                onView={setViewingPlan}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPlans.filter(p => p.status === 'completed').map(plan => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                onToggleStatus={togglePlanStatus}
                onDelete={deletePlan}
                onSelect={onSelectPlan}
                onView={setViewingPlan}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Detail Dialog */}
      <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {viewingPlan?.examName} - Detailed View
            </DialogTitle>
          </DialogHeader>
          {viewingPlan && <PlanDetailView plan={viewingPlan} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Plan Card Component
const PlanCard: React.FC<{
  plan: SavedExamPlan;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (plan: SavedExamPlan) => void;
  onView: (plan: SavedExamPlan) => void;
}> = ({ plan, onToggleStatus, onDelete, onSelect, onView }) => {
  const priority = getPriorityLevel(plan.daysLeft);

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-100 text-gray-700';
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className={`${plan.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{plan.examName}</h3>
            <p className="text-sm text-gray-600">
              {plan.class} • {new Date(plan.examDate).toLocaleDateString('hi-IN')}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getStatusColor(plan.status, plan.isActive)}>
              {plan.isActive ? 'Active' : 'Paused'}
            </Badge>
            <Badge className={priority.color}>
              {priority.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm">{Math.round(plan.progress)}%</span>
            </div>
            <Progress value={plan.progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white rounded">
              <div className="text-lg font-bold text-blue-600">{plan.daysLeft}</div>
              <p className="text-xs text-gray-600">Days Left</p>
            </div>
            <div className="p-2 bg-white rounded">
              <div className="text-lg font-bold text-green-600">{plan.completedTasks}</div>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="p-2 bg-white rounded">
              <div className="text-lg font-bold text-purple-600">{plan.subjects.length}</div>
              <p className="text-xs text-gray-600">Subjects</p>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <p className="text-sm font-medium mb-2">Subjects:</p>
            <div className="flex flex-wrap gap-1">
              {plan.subjects.slice(0, 3).map(subject => (
                <Badge key={subject} variant="outline" className="text-xs">
                  {subject}
                </Badge>
              ))}
              {plan.subjects.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{plan.subjects.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onSelect(plan)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Open
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onView(plan)}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onToggleStatus(plan.id)}
            >
              {plan.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDelete(plan.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Plan Detail View Component
const PlanDetailView: React.FC<{ plan: SavedExamPlan }> = ({ plan }) => {
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{plan.daysLeft}</div>
          <p className="text-sm text-gray-600">Days Remaining</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{Math.round(plan.progress)}%</div>
          <p className="text-sm text-gray-600">Progress</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{plan.completedTasks}/{plan.totalTasks}</div>
          <p className="text-sm text-gray-600">Tasks Done</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{plan.dailyHours}h</div>
          <p className="text-sm text-gray-600">Daily Hours</p>
        </div>
      </div>

      {/* Subjects Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subject-wise Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.subjects.map(subject => (
              <div key={subject} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{subject}</span>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <Progress value={Math.random() * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Daily Study Time</p>
                  <p className="text-sm text-gray-600">{plan.dailyHours} hours per day</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Current Focus</p>
                  <p className="text-sm text-gray-600">{plan.currentStudyStatus}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Exam Date</p>
                  <p className="text-sm text-gray-600">{new Date(plan.examDate).toLocaleDateString('hi-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function for priority level
const getPriorityLevel = (daysLeft: number) => {
  if (daysLeft <= 7) return { label: 'Urgent', color: 'bg-red-100 text-red-800' };
  if (daysLeft <= 30) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
  if (daysLeft <= 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Low', color: 'bg-green-100 text-green-800' };
};

export default PlanManagementSystem;
