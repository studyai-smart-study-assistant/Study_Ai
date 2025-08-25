
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/student/Badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Star, 
  AlertCircle,
  Lightbulb,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StudyPlan, ExamPlanData, UserProgress } from './types';

interface SmartRecommendationsProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  userProgress: UserProgress;
  onApplyRecommendation: (recommendation: any) => void;
}

interface SmartRecommendation {
  id: string;
  type: 'time_optimization' | 'weak_area_focus' | 'difficulty_adjustment' | 'study_pattern';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionText: string;
  data: any;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  studyPlan,
  examData,
  userProgress,
  onApplyRecommendation
}) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);

  useEffect(() => {
    generateSmartRecommendations();
  }, [userProgress, studyPlan]);

  const generateSmartRecommendations = () => {
    const newRecommendations: SmartRecommendation[] = [];

    // Time Optimization Recommendation
    if (userProgress.totalTasksCompleted > 5) {
      const averageCompletionTime = calculateAverageStudyTime();
      if (averageCompletionTime > 0) {
        newRecommendations.push({
          id: 'time_optimization',
          type: 'time_optimization',
          title: 'समय अनुकूलन सुझाव',
          description: `आपका average study time ${averageCompletionTime} minutes है। हम आपके लिए optimal time slots suggest कर सकते हैं।`,
          impact: 'high',
          actionText: 'Time Schedule Optimize करें',
          data: { suggestedTime: averageCompletionTime }
        });
      }
    }

    // Weak Area Focus
    const weakAreas = identifyWeakAreas();
    if (weakAreas.length > 0) {
      newRecommendations.push({
        id: 'weak_area_focus',
        type: 'weak_area_focus',
        title: 'कमजोर क्षेत्रों पर फोकस',
        description: `${weakAreas.join(', ')} में extra practice की जरूरत है। इन topics पर 20% अधिक समय दें।`,
        impact: 'high',
        actionText: 'Extra Practice Plan बनाएं',
        data: { weakAreas }
      });
    }

    // Study Pattern Recommendation
    const bestStudyTime = getBestStudyTime();
    if (bestStudyTime) {
      newRecommendations.push({
        id: 'study_pattern',
        type: 'study_pattern',
        title: 'सर्वोत्तम अध्ययन समय',
        description: `आपका peak performance time ${bestStudyTime} है। कठिन subjects इस समय पढ़ें।`,
        impact: 'medium',
        actionText: 'Schedule Adjust करें',
        data: { bestTime: bestStudyTime }
      });
    }

    // Difficulty Adjustment
    if (userProgress.totalTasksCompleted > 10) {
      const averageScore = calculateAveragePerformance();
      if (averageScore > 85) {
        newRecommendations.push({
          id: 'difficulty_increase',
          type: 'difficulty_adjustment',
          title: 'Challenge Level बढ़ाएं',
          description: `आपका performance excellent है (${averageScore}%)! Advanced topics add करें।`,
          impact: 'medium',
          actionText: 'Advanced Topics Add करें',
          data: { currentScore: averageScore }
        });
      } else if (averageScore < 60) {
        newRecommendations.push({
          id: 'difficulty_decrease',
          type: 'difficulty_adjustment',
          title: 'Foundation Strengthen करें',
          description: `Basic concepts पर focus करें। Current score: ${averageScore}%`,
          impact: 'high',
          actionText: 'Basic Concepts Revise करें',
          data: { currentScore: averageScore }
        });
      }
    }

    setRecommendations(newRecommendations);
  };

  const calculateAverageStudyTime = (): number => {
    // Mock calculation - in real app, this would analyze user's actual study patterns
    return Math.floor(Math.random() * 30) + 45; // 45-75 minutes
  };

  const identifyWeakAreas = (): string[] => {
    // Mock analysis - in real app, this would analyze user's performance data
    const allSubjects = examData.subjects;
    const weakSubjects = allSubjects.filter(() => Math.random() < 0.3);
    return weakSubjects.slice(0, 2);
  };

  const getBestStudyTime = (): string => {
    const times = ['सुबह 6-8 बजे', 'दोपहर 2-4 बजे', 'शाम 6-8 बजे', 'रात 8-10 बजे'];
    return times[Math.floor(Math.random() * times.length)];
  };

  const calculateAveragePerformance = (): number => {
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  };

  const handleApplyRecommendation = (recommendation: SmartRecommendation) => {
    setAppliedRecommendations(prev => [...prev, recommendation.id]);
    onApplyRecommendation(recommendation);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'time_optimization': return <Clock className="h-4 w-4" />;
      case 'weak_area_focus': return <Target className="h-4 w-4" />;
      case 'difficulty_adjustment': return <TrendingUp className="h-4 w-4" />;
      case 'study_pattern': return <Activity className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Brain className="h-5 w-5" />
          AI Smart Recommendations
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Personalized
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          आपके study pattern के आधार पर intelligent suggestions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              कुछ tasks complete करें ताकि हम आपके लिए personalized recommendations generate कर सकें
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <Card 
                key={recommendation.id}
                className={`${appliedRecommendations.includes(recommendation.id) ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(recommendation.type)}
                        <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                        <Badge className={getImpactColor(recommendation.impact)} size="sm">
                          {recommendation.impact} impact
                        </Badge>
                      </div>
                      {appliedRecommendations.includes(recommendation.id) && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Applied ✓
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700">
                      {recommendation.description}
                    </p>
                    
                    {!appliedRecommendations.includes(recommendation.id) && (
                      <Button
                        onClick={() => handleApplyRecommendation(recommendation)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {recommendation.actionText}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations;
