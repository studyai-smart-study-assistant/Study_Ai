
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudyPlan, ExamPlanData } from '../types';

interface StudyPlanHeaderProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  daysLeft: number;
}

const StudyPlanHeader: React.FC<StudyPlanHeaderProps> = ({
  studyPlan,
  examData,
  daysLeft
}) => {
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-blue-800 mb-2">
              📚 {examData.examName} - Study Plan Ready!
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {daysLeft > 0 ? `${daysLeft} दिन बचे हैं` : 'Exam Today!'}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {studyPlan.subjectPlans.length} Subjects
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {studyPlan.dailyTasks?.length || 0} Daily Tasks
              </Badge>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {studyPlan.overview}
        </p>
      </CardHeader>
    </Card>
  );
};

export default StudyPlanHeader;
