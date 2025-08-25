
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Puzzle, Star } from 'lucide-react';
import { Achievement } from '@/types/student';

interface AchievementsListProps {
  achievements: Achievement[];
}

const AchievementsList: React.FC<AchievementsListProps> = ({ achievements }) => {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'quiz': return <Puzzle className="h-4 w-4 text-blue-500" />;
      default: return <Star className="h-4 w-4 text-purple-500" />;
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          प्रमुख उपलब्धियां
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length > 0 ? (
          <div className="space-y-2">
            {achievements.map(achievement => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md"
              >
                <div className="p-2 bg-white dark:bg-gray-800 rounded-full">
                  {getAchievementIcon(achievement.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{achievement.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(achievement.timestamp).toLocaleDateString('hi-IN')}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  +{achievement.points}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>कोई उपलब्धि नहीं मिली</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsList;
