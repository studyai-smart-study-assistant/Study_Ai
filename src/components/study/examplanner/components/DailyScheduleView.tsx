
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from 'lucide-react';
import { StudyPlan } from '../types';

interface DailyScheduleViewProps {
  studyPlan: StudyPlan;
}

const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({ studyPlan }) => {
  const tasks = studyPlan.dailyTasks || studyPlan.dailySchedule || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          दैनिक कार्य सूची
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.slice(0, 7).map((task, index) => (
            <div key={index} className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.subject} - {task.chapter}</h4>
                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                </div>
                <div className="text-right ml-2">
                  <Badge variant="outline" className="text-xs">{task.duration}min</Badge>
                  <p className="text-xs text-gray-500 mt-1">{task.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyScheduleView;
