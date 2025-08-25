import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Calendar, 
  BookOpen, 
  Play, 
  Pause,
  Eye,
  Plus,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ActivePlan {
  id: string;
  examName: string;
  examDate: string;
  class: string;
  subjects: string[];
  isActive: boolean;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  daysLeft: number;
  completedTasks: number;
  totalTasks: number;
}

const ActivePlansWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadActivePlans();
    }
  }, [currentUser]);

  const loadActivePlans = () => {
    if (!currentUser) return;
    
    const saved = localStorage.getItem(`study_plans_${currentUser.uid}`);
    if (saved) {
      try {
        const allPlans = JSON.parse(saved);
        const active = allPlans
          .filter((plan: any) => plan.isActive)
          .map((plan: any) => ({
            id: plan.id,
            examName: plan.examName,
            examDate: plan.examDate,
            class: plan.class,
            subjects: plan.subjects,
            isActive: plan.isActive,
            status: plan.status,
            progress: plan.progress,
            daysLeft: Math.ceil((new Date(plan.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            completedTasks: plan.completedTasks,
            totalTasks: plan.totalTasks
          }));
        setActivePlans(active);
      } catch (error) {
        console.error('Error loading active plans:', error);
      }
    }
  };

  const handleViewAllPlans = () => {
    navigate('/', { state: { openStudyTools: true, activeTab: 'exam-prep' } });
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'text-red-600 bg-red-100';
    if (daysLeft <= 30) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Target className="h-5 w-5" />
            Active Study Plans
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {activePlans.length} Active
            </Badge>
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleViewAllPlans}
            className="border-blue-200 hover:bg-blue-50"
          >
            <Eye className="h-3 w-3 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activePlans.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-700 mb-2">No Active Plans</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a study plan to track your exam preparation
            </p>
            <Button 
              onClick={handleViewAllPlans}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activePlans.slice(0, 3).map(plan => (
              <Card key={plan.id} className="border-blue-200 bg-white/70">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Plan Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-800">{plan.examName}</h4>
                        <p className="text-sm text-blue-600">
                          {plan.class} • {new Date(plan.examDate).toLocaleDateString('hi-IN')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getUrgencyColor(plan.daysLeft)}>
                          {plan.daysLeft} days
                        </Badge>
                        <Badge 
                          className={plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {plan.status}
                        </Badge>
                      </div>
                    </div>

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
                      <div className="p-2 bg-blue-50 rounded text-xs">
                        <div className="font-bold text-blue-600">{plan.subjects.length}</div>
                        <p className="text-gray-600">Subjects</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-xs">
                        <div className="font-bold text-green-600">{plan.completedTasks}</div>
                        <p className="text-gray-600">Done</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded text-xs">
                        <div className="font-bold text-purple-600">{plan.totalTasks}</div>
                        <p className="text-gray-600">Total</p>
                      </div>
                    </div>

                    {/* Subjects Preview */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {plan.subjects.slice(0, 2).map(subject => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {plan.subjects.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.subjects.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {activePlans.length > 3 && (
              <div className="text-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewAllPlans}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  View {activePlans.length - 3} More Plans
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivePlansWidget;
