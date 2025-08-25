
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Target } from 'lucide-react';
import { StudyPlan } from '../types';

interface PlanOverviewStatsProps {
  studyPlan: StudyPlan;
}

const PlanOverviewStats: React.FC<PlanOverviewStatsProps> = ({ studyPlan }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-orange-200">
        <CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">
            {studyPlan.totalDaysAvailable}
          </div>
          <p className="text-sm text-gray-600">Total Days</p>
        </CardContent>
      </Card>
      
      <Card className="border-blue-200">
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">
            {studyPlan.dailyStudyHours}h
          </div>
          <p className="text-sm text-gray-600">Daily Study</p>
        </CardContent>
      </Card>
      
      <Card className="border-green-200">
        <CardContent className="p-4 text-center">
          <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            {studyPlan.progressMilestones.length}
          </div>
          <p className="text-sm text-gray-600">Milestones</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanOverviewStats;
