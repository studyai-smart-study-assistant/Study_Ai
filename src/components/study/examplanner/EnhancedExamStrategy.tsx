
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Star, 
  Zap,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Timer,
  BarChart3,
  Trophy
} from 'lucide-react';
import { ExamPlanData, StudyPlan } from './types';

interface EnhancedExamStrategyProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  onApplyStrategy: (strategy: any) => void;
}

interface ExamStrategy {
  id: string;
  type: 'revision' | 'practice' | 'weak_areas' | 'time_management' | 'confidence_building';
  title: string;
  description: string;
  timeToImplement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedImprovement: number;
  steps: string[];
  tips: string[];
}

const EnhancedExamStrategy: React.FC<EnhancedExamStrategyProps> = ({
  studyPlan,
  examData,
  onApplyStrategy
}) => {
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
  const [appliedStrategies, setAppliedStrategies] = useState<string[]>([]);

  const examStrategies: ExamStrategy[] = [
    {
      id: 'power_revision',
      type: 'revision',
      title: '🔥 Power Revision Technique',
      description: 'Last 7 days में maximum retention के लिए scientific revision method',
      timeToImplement: '7 दिन पहले से',
      difficulty: 'medium',
      expectedImprovement: 25,
      steps: [
        'Day 7: सभी chapters का quick overview (15 min each)',
        'Day 6: Important formulas और definitions',
        'Day 5: Previous year questions solve करें',
        'Day 4: Weak areas पर focus करें',
        'Day 3: Mock test attempt करें',
        'Day 2: Quick revision + doubt clearing',
        'Day 1: Light revision + confidence building'
      ],
      tips: [
        'हर topic के लिए memory tricks बनाएं',
        '25-min study + 5-min break pattern follow करें',
        'Voice में notes record करके सुनें'
      ]
    },
    {
      id: 'smart_practice',
      type: 'practice',
      title: '🎯 Smart Practice Strategy',
      description: 'Targeted practice जो आपके weak areas को strong बनाए',
      timeToImplement: '2 हफ्ते पहले से',
      difficulty: 'hard',
      expectedImprovement: 30,
      steps: [
        'Weekly mock tests schedule करें',
        'Error analysis detailed में करें',
        'Same type के questions repeatedly solve करें',
        'Time-bound practice sessions',
        'Peer group discussions organize करें'
      ],
      tips: [
        'Wrong answers को अलग notebook में note करें',
        'Pattern identify करके similar questions solve करें',
        'Timer use करके speed बढ़ाएं'
      ]
    },
    {
      id: 'confidence_boost',
      type: 'confidence_building',
      title: '💪 Confidence Building Plan',
      description: 'Exam anxiety को कम करके confidence boost करने की strategy',
      timeToImplement: 'पूरी preparation के दौरान',
      difficulty: 'easy',
      expectedImprovement: 20,
      steps: [
        'Daily positive affirmations practice करें',
        'Easy questions से start करके confidence build करें',
        'Study achievements को celebrate करें',
        'Relaxation techniques सीखें',
        'Success stories पढ़ें'
      ],
      tips: [
        'Exam hall में जाने से पहले deep breathing करें',
        'Favorite music सुनकर mood fresh करें',
        'Previous successes को remember करें'
      ]
    },
    {
      id: 'time_master',
      type: 'time_management',
      title: '⏰ Time Management Mastery',
      description: 'Exam में time की perfect utilization के लिए strategy',
      timeToImplement: '1 महीना पहले से',
      difficulty: 'medium',
      expectedImprovement: 35,
      steps: [
        'Question paper को 5 min में scan करें',
        'Easy से difficult order में solve करें',
        'हर question के लिए time limit set करें',
        'Review के लिए 10-15 min reserve रखें',
        'Practice tests में timing track करें'
      ],
      tips: [
        'Stuck हो जाएं तो question skip करें',
        'Last 15 minutes में answers review करें',
        'Watch या clock regularly check करें'
      ]
    },
    {
      id: 'weak_area_elimination',
      type: 'weak_areas',
      title: '🎪 Weak Area Elimination',
      description: 'Weak subjects/topics को strong बनाने की systematic approach',
      timeToImplement: '3 हफ्ते पहले से',
      difficulty: 'hard',
      expectedImprovement: 40,
      steps: [
        'Weak areas को priority order में list करें',
        'हर weak topic के लिए separate schedule बनाएं',
        'Basic concepts से start करें',
        'Progressive difficulty में practice करें',
        'Regular assessment करते रहें'
      ],
      tips: [
        'Tutor या friend से help लें',
        'Online resources और videos use करें',
        'Daily progress track करें'
      ]
    }
  ];

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'revision': return <BookOpen className="h-5 w-5" />;
      case 'practice': return <Target className="h-5 w-5" />;
      case 'weak_areas': return <TrendingUp className="h-5 w-5" />;
      case 'time_management': return <Timer className="h-5 w-5" />;
      case 'confidence_building': return <Award className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApplyStrategy = (strategy: ExamStrategy) => {
    setAppliedStrategies(prev => [...prev, strategy.id]);
    onApplyStrategy(strategy);
  };

  const calculateDaysLeft = () => {
    const examDate = new Date(examData.examDate);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft();

  return (
    <div className="space-y-6">
      {/* Exam Overview */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Trophy className="h-6 w-6" />
            {examData.examName} - Strategic Preparation
          </CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Badge className="bg-blue-100 text-blue-800">
              {daysLeft > 0 ? `${daysLeft} दिन बचे हैं` : 'Exam Today!'}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              {examData.subjects.length} Subjects
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {examData.dailyHours}h Daily Study
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Exam Strategies */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">सभी Strategies</TabsTrigger>
          <TabsTrigger value="priority">Priority Based</TabsTrigger>
          <TabsTrigger value="applied">Applied Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {examStrategies.map((strategy) => (
              <Card 
                key={strategy.id}
                className={`${appliedStrategies.includes(strategy.id) 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-purple-300'
                } transition-all duration-300 hover:shadow-md`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStrategyIcon(strategy.type)}
                      <div>
                        <h3 className="font-semibold text-lg">{strategy.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getDifficultyColor(strategy.difficulty)}>
                        {strategy.difficulty}
                      </Badge>
                      {appliedStrategies.includes(strategy.id) && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Applied
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{strategy.timeToImplement}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">+{strategy.expectedImprovement}% improvement</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {activeStrategy === strategy.id && (
                    <div className="space-y-4">
                      {/* Implementation Steps */}
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          Implementation Steps:
                        </h4>
                        <div className="space-y-2">
                          {strategy.steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tips */}
                      <div>
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Pro Tips:
                        </h4>
                        <div className="space-y-1">
                          {strategy.tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-yellow-500">💡</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStrategy(
                        activeStrategy === strategy.id ? null : strategy.id
                      )}
                      className="flex-1"
                    >
                      {activeStrategy === strategy.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    {!appliedStrategies.includes(strategy.id) && (
                      <Button
                        onClick={() => handleApplyStrategy(strategy)}
                        className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Apply Strategy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <div className="grid gap-4">
            {examStrategies
              .sort((a, b) => b.expectedImprovement - a.expectedImprovement)
              .slice(0, 3)
              .map((strategy) => (
                <Card key={strategy.id} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStrategyIcon(strategy.type)}
                        <div>
                          <h3 className="font-semibold">{strategy.title}</h3>
                          <p className="text-sm text-gray-600">{strategy.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        High Priority
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          {appliedStrategies.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">अभी तक कोई strategy apply नहीं की गई है</p>
              <p className="text-sm text-gray-500">Strategies apply करके अपनी preparation enhance करें</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {examStrategies
                .filter(strategy => appliedStrategies.includes(strategy.id))
                .map((strategy) => (
                  <Card key={strategy.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-semibold text-green-800">{strategy.title}</h3>
                            <p className="text-sm text-green-600">Successfully Applied</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedExamStrategy;
