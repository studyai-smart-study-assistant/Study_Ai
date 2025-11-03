import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Target, Zap } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface EnhancedStreakDisplayProps {
  streakDays: number;
  longestStreak?: number;
  userId: string;
}

const EnhancedStreakDisplay: React.FC<EnhancedStreakDisplayProps> = ({
  streakDays,
  longestStreak = 0,
  userId
}) => {
  const getStreakLevel = () => {
    if (streakDays >= 30) return { level: 'Diamond', color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
    if (streakDays >= 21) return { level: 'Platinum', color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (streakDays >= 14) return { level: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (streakDays >= 7) return { level: 'Silver', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    if (streakDays >= 3) return { level: 'Bronze', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { level: 'Beginner', color: 'text-blue-500', bg: 'bg-blue-500/10' };
  };

  const getNextMilestone = () => {
    const milestones = [3, 7, 14, 21, 30, 50, 100];
    return milestones.find(m => m > streakDays) || streakDays + 10;
  };

  const streakLevel = getStreakLevel();
  const nextMilestone = getNextMilestone();
  const progressToNext = ((streakDays % nextMilestone) / nextMilestone) * 100;

  const getStreakMessage = () => {
    if (streakDays === 0) return 'आज से शुरुआत करें!';
    if (streakDays === 1) return 'शानदार शुरुआत! 🌟';
    if (streakDays < 7) return 'बढ़िया! जारी रखें! 💪';
    if (streakDays < 14) return 'आप तो Champion बन रहे हैं! 🏆';
    if (streakDays < 30) return 'अद्भुत समर्पण! 🌟';
    return 'आप एक Legend हैं! 👑';
  };

  return (
    <Card className={`${streakLevel.bg} border-2`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className={`h-6 w-6 ${streakLevel.color}`} />
              <h3 className="text-2xl font-bold">{streakDays} दिन की Streak</h3>
            </div>
            <p className="text-sm text-muted-foreground">{getStreakMessage()}</p>
          </div>
          <Badge className={streakLevel.color}>
            <Trophy className="h-3 w-3 mr-1" />
            {streakLevel.level}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">अगला Milestone</span>
            <span className="font-semibold">{nextMilestone} दिन</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {nextMilestone - streakDays} दिन और!
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-xl font-bold">{streakDays}</span>
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xl font-bold">{longestStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
        </div>

        {streakDays >= 7 && (
          <div className="mt-4 p-3 bg-background/50 rounded-lg text-center">
            <p className="text-sm font-medium">
              🎉 साप्ताहिक बोनस: +{Math.floor(streakDays / 7) * 15} extra points!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedStreakDisplay;
