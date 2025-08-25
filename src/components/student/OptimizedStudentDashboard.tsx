
import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, BookOpen } from 'lucide-react';

interface StudentStats {
  points: number;
  level: number;
  streak: number;
  studyTime: number;
}

interface OptimizedStudentDashboardProps {
  stats: StudentStats;
}

const OptimizedStudentDashboard: React.FC<OptimizedStudentDashboardProps> = memo(({ stats }) => {
  const quickStats = [
    {
      icon: <Trophy className="h-4 w-4 text-yellow-600" />,
      label: "Points",
      value: stats.points,
      color: "text-yellow-600"
    },
    {
      icon: <Target className="h-4 w-4 text-blue-600" />,
      label: "Level",
      value: stats.level,
      color: "text-blue-600"
    },
    {
      icon: <Clock className="h-4 w-4 text-green-600" />,
      label: "Streak",
      value: `${stats.streak} दिन`,
      color: "text-green-600"
    },
    {
      icon: <BookOpen className="h-4 w-4 text-purple-600" />,
      label: "Study Time",
      value: `${stats.studyTime}h`,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {quickStats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              {stat.icon}
            </div>
            <div className={`text-lg font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-600">
              {stat.label}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

OptimizedStudentDashboard.displayName = 'OptimizedStudentDashboard';

export default OptimizedStudentDashboard;
