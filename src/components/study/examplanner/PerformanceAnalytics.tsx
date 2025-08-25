
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  Target,
  BarChart3,
  Calendar,
  Award,
  Activity,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PerformanceAnalyticsProps {
  studyData?: any;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ studyData }) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    generateAnalyticsData();
  }, [timeRange]);

  const generateAnalyticsData = () => {
    // Mock data - in real app this would come from user's actual study data
    const data = {
      overallProgress: {
        completed: 68,
        target: 85,
        streak: 12,
        totalHours: 47.5
      },
      weeklyProgress: [
        { day: 'Mon', hours: 6.5, score: 78, tasks: 8 },
        { day: 'Tue', hours: 5.2, score: 82, tasks: 6 },
        { day: 'Wed', hours: 7.1, score: 85, tasks: 9 },
        { day: 'Thu', hours: 4.8, score: 79, tasks: 7 },
        { day: 'Fri', hours: 6.9, score: 88, tasks: 10 },
        { day: 'Sat', hours: 8.2, score: 91, tasks: 12 },
        { day: 'Sun', hours: 5.5, score: 86, tasks: 8 }
      ],
      subjectPerformance: [
        { subject: 'Mathematics', score: 75, time: 15.2, improvement: +8 },
        { subject: 'Physics', score: 82, time: 12.8, improvement: +12 },
        { subject: 'Chemistry', score: 89, time: 11.5, improvement: +5 },
        { subject: 'Biology', score: 93, time: 8.0, improvement: +15 }
      ],
      studyPatterns: {
        peakHours: ['9:00-11:00 AM', '7:00-9:00 PM'],
        averageSession: 45,
        breakFrequency: 'Every 25 minutes',
        productivityScore: 87
      },
      achievements: [
        { title: '7-Day Streak Master', date: 'Today', type: 'streak' },
        { title: 'Chemistry Champion', date: '2 days ago', type: 'subject' },
        { title: 'Early Bird', date: '3 days ago', type: 'timing' }
      ]
    };

    setAnalyticsData(data);
  };

  if (!analyticsData) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Analytics load कर रहे हैं...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <BarChart3 className="h-5 w-5" />
              Performance Analytics Dashboard
              <Badge className="bg-green-100 text-green-800">Live Data</Badge>
            </CardTitle>
            <div className="flex gap-2">
              {['7days', '30days', '90days'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range === '7days' ? '7D' : range === '30days' ? '30D' : '90D'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-600">
              {analyticsData.overallProgress.completed}%
            </div>
            <p className="text-xs text-gray-600">Overall Progress</p>
            <Progress value={analyticsData.overallProgress.completed} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-orange-600">
              {analyticsData.overallProgress.totalHours}h
            </div>
            <p className="text-xs text-gray-600">Total Study Time</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-purple-600">
              {analyticsData.overallProgress.streak}
            </div>
            <p className="text-xs text-gray-600">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-600">
              {analyticsData.studyPatterns.productivityScore}%
            </div>
            <p className="text-xs text-gray-600">Productivity Score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Progress Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" strokeWidth={2} name="Study Hours" />
                  <Line type="monotone" dataKey="score" stroke="#82ca9d" strokeWidth={2} name="Average Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid gap-4">
            {analyticsData.subjectPerformance.map((subject: any, index: number) => (
              <Card key={index} className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{subject.subject}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Score:</span>
                          <Progress value={subject.score} className="w-20 h-2" />
                          <span className="text-sm font-medium">{subject.score}%</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {subject.time}h spent
                        </div>
                        <Badge className={`${
                          subject.improvement > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subject.improvement > 0 ? '+' : ''}{subject.improvement}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Peak Hours:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analyticsData.studyPatterns.peakHours.map((hour: string, index: number) => (
                      <Badge key={index} variant="outline">{hour}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Average Session:</span>
                  <span className="ml-2 text-sm text-gray-600">{analyticsData.studyPatterns.averageSession} minutes</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Break Pattern:</span>
                  <span className="ml-2 text-sm text-gray-600">{analyticsData.studyPatterns.breakFrequency}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analyticsData.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="space-y-3">
            {analyticsData.achievements.map((achievement: any, index: number) => (
              <Card key={index} className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">{achievement.title}</h4>
                      <p className="text-sm text-yellow-600">{achievement.date}</p>
                    </div>
                    <Badge className="bg-yellow-200 text-yellow-800">
                      {achievement.type}
                    </Badge>
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

export default PerformanceAnalytics;
