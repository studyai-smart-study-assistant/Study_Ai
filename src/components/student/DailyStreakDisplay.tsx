
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentStreakSync, getLongestStreakSync, getStreakData } from '@/utils/streakUtils';

interface DailyStreakDisplayProps {
  streakDays: number;
  nextMilestone?: number;
  className?: string;
  userId?: string;
}

const DailyStreakDisplay: React.FC<DailyStreakDisplayProps> = ({ 
  streakDays, 
  nextMilestone = 7,
  className,
  userId 
}) => {
  const { t } = useLanguage();
  const [currentStreak, setCurrentStreak] = useState(streakDays);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (userId) {
      // Use sync version for immediate display
      const syncStreak = getCurrentStreakSync(userId);
      const syncLongest = getLongestStreakSync(userId);
      setCurrentStreak(syncStreak);
      setLongestStreak(syncLongest);
      
      // Then update with Firebase data
      setLoading(true);
      getStreakData(userId).then(data => {
        setCurrentStreak(data.currentStreak);
        setLongestStreak(data.longestStreak);
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching streak data:', error);
        setLoading(false);
      });
    } else {
      setCurrentStreak(streakDays);
    }
  }, [userId, streakDays]);
  
  // Calculate next milestone (next multiple of 7, or next multiple of 3 if less than 7)
  const calculateNextMilestone = () => {
    if (currentStreak < 3) return 3;
    if (currentStreak < 7) return 7;
    return Math.ceil(currentStreak / 7) * 7;
  };

  const actualNextMilestone = nextMilestone || calculateNextMilestone();
  const progress = Math.min(100, (currentStreak / actualNextMilestone) * 100);
  
  // Determine flame color based on streak length
  const getFlameColor = () => {
    if (currentStreak >= 30) return "text-red-500";
    if (currentStreak >= 14) return "text-orange-500";
    if (currentStreak >= 7) return "text-yellow-500";
    return "text-amber-400";
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-2 px-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Flame className={`h-5 w-5 ${getFlameColor()}`} />
          {t('dailyStreak')}
        </h3>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1">
              <Flame className={`h-4 w-4 mr-1 ${getFlameColor()}`} />
              {currentStreak} {t('dayStreak')}
            </Badge>
          </div>
          
          {currentStreak >= 7 && (
            <Badge className="bg-yellow-500">
              <Award className="h-3 w-3 mr-1" />
              {Math.floor(currentStreak / 7)} {t('streakBonus')}
            </Badge>
          )}
        </div>
        
        {longestStreak > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">सबसे लंबी स्ट्रीक:</span>
            <Badge variant="secondary">{longestStreak} दिन</Badge>
          </div>
        )}
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span>{currentStreak} {t('dayStreak')}</span>
            <span>{actualNextMilestone} {t('dayStreak')}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-purple-500" />
          {t('loginTomorrow')}
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyStreakDisplay;
