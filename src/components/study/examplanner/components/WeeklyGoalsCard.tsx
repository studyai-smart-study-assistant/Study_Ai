
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from 'lucide-react';
import { StudyPlan } from '../types';

interface WeeklyGoalsCardProps {
  studyPlan: StudyPlan;
}

const WeeklyGoalsCard: React.FC<WeeklyGoalsCardProps> = ({ studyPlan }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Weekly Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {studyPlan.weeklyGoals.slice(0, 3).map((goal, index) => (
            <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <h4 className="font-medium">Week {goal.week}: {goal.focus}</h4>
              <p className="text-sm text-gray-600 mt-1">{goal.assessment}</p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={goal.targetCompletion} className="flex-1 h-2" />
                <span className="text-xs">{goal.targetCompletion}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyGoalsCard;
