
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/student/Badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { StudyPlan, ExamPlanData, UserProgress } from './types';

interface EnhancedAnalyticsProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  userProgress: UserProgress;
}

interface AnalyticsData {
  weeklyProgress: any[];
  subjectPerformance: any[];
  timeDistribution: any[];
  performanceTrends: any[];
  studyEffectiveness: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];

const EnhancedAnalytics: React.FC<EnhancedAnalyticsProps> = ({
  studyPlan,
  examData,
  userProgress
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    generateAnalyticsData();
  }, [userProgress, studyPlan]);

  const generateAnalyticsData = () => {
    // Mock data generation - in real app, this would come from actual user data
    const weeklyProgress = Array.from({ length: 8 }, (_, i) => ({
      week: `Week ${i + 1}`,
      tasksCompleted: Math.floor(Math.random() * 20) + 5,
      targetTasks: 25,
      hoursStudied: Math.floor(Math.random() * 30) + 15,
      averageScore: Math.floor(Math.random() * 30) + 70
    }));

    const subjectPerformance = examData.subjects.map(subject => ({
      subject,
      score: Math.floor(Math.random() * 30) + 70,
      timeSpent: Math.floor(Math.random() * 20) + 10,
      tasksCompleted: Math.floor(Math.random() * 15) + 5,
      difficulty: Math.random() * 2 + 3
    }));

    const timeDistribution = [
      { name: 'Study', value: 60, color: '#8884d8' },
      { name: 'Practice', value: 25, color: '#82ca9d' },
      { name: 'Revision', value: 15, color: '#ffc658' }
    ];

    const performanceTrends = Array.from({ length: 14 }, (_, i) => ({
      day: `Day ${i + 1}`,
      performance: Math.floor(Math.random() * 20) + 70,
      timeSpent: Math.floor(Math.random() * 3) + 2,
      focus: Math.floor(Math.random() * 20) + 80
    }));

    const studyEffectiveness = Math.floor(Math.random() * 20) + 75;

    setAnalyticsData({
      weeklyProgress,
      subjectPerformance,
      timeDistribution,
      performanceTrends,
      studyEffectiveness
    });
  };

  const getPerformanceInsights = () => {
    if (!analyticsData) return [];

    const insights = [];
    
    // Best performing subject
    const bestSubject = analyticsData.subjectPerformance.reduce((max, current) => 
      current.score > max.score ? current : max
    );
    insights.push({
      type: 'success',
      title: 'सबसे अच्छा Subject',
      description: `${bestSubject.subject} में आपका performance excellent है (${bestSubject.score}%)`
    });

    // Study effectiveness
    if (analyticsData.studyEffectiveness > 85) {
      insights.push({
        type: 'success',
        title: 'High Study Effectiveness',
        description: `आपकी study efficiency ${analyticsData.studyEffectiveness}% है - बहुत बढ़िया!`
      });
    } else if (analyticsData.studyEffectiveness < 70) {
      insights.push({
        type: 'warning',
        title: 'Study Method Improvement',
        description: `Study effectiveness ${analyticsData.studyEffectiveness}% है। अलग techniques try करें।`
      });
    }

    // Consistency check
    const weeklyScores = analyticsData.weeklyProgress.map(w => w.averageScore);
    const consistency = weeklyScores.every(score => score > 70);
    if (consistency) {
      insights.push({
        type: 'success',
        title: 'Consistent Performance',
        description: 'आपका performance consistently good है!'
      });
    }

    return insights;
  };

  if (!analyticsData) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Analytics generate कर रहे हैं...</p>
        </div>
      </div>
    );
  }

  const insights = getPerformanceInsights();

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <BarChart3 className="h-5 w-5" />
            Enhanced Study Analytics
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              AI-Powered Insights
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Study Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.studyEffectiveness}%
                  </div>
                  <div className="flex-1">
                    <Progress value={analyticsData.studyEffectiveness} className="h-2" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Overall learning efficiency rating
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={analyticsData.timeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.timeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weekly Progress Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analyticsData.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="averageScore" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="hoursStudied" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Subject-wise Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <Card key={index} className={`${
                insight.type === 'success' ? 'border-green-200 bg-green-50' :
                insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      insight.type === 'success' ? 'bg-green-500' :
                      insight.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalytics;
