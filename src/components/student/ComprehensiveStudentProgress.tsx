
import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, BarChart, Clock, Award, Trophy, TrendingUp, Activity } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { ComprehensiveActivityTracker, ComprehensiveSubjectProgress } from '@/utils/comprehensiveActivityTracker';

interface ComprehensiveStudentProgressProps {
  currentUser: any;
}

const ComprehensiveStudentProgress: React.FC<ComprehensiveStudentProgressProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [subjectProgress, setSubjectProgress] = useState<ComprehensiveSubjectProgress[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [averageConsistency, setAverageConsistency] = useState(0);
  
  useEffect(() => {
    if (currentUser) {
      loadComprehensiveData();
    }
  }, [currentUser]);

  const loadComprehensiveData = () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log('Loading comprehensive student progress data...');
      
      const comprehensiveProgress = ComprehensiveActivityTracker.getComprehensiveProgress(currentUser.uid);
      const allActivities = ComprehensiveActivityTracker.getUserActivities(currentUser.uid);
      
      console.log('Comprehensive progress loaded:', {
        subjects: comprehensiveProgress.length,
        totalActivities: allActivities.length,
        activities: allActivities
      });
      
      setSubjectProgress(comprehensiveProgress);
      setTotalActivities(allActivities.length);
      
      const totalTime = comprehensiveProgress.reduce((sum, subject) => sum + subject.studyTimeMinutes, 0);
      setTotalStudyTime(totalTime);
      
      const avgConsistency = comprehensiveProgress.length > 0 
        ? comprehensiveProgress.reduce((sum, subject) => sum + subject.consistencyScore, 0) / comprehensiveProgress.length
        : 0;
      setAverageConsistency(avgConsistency);
      
    } catch (error) {
      console.error('Error loading comprehensive progress data:', error);
      setSubjectProgress([]);
      setTotalActivities(0);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateOverallProgress = () => {
    if (subjectProgress.length === 0) return 0;
    const totalProgress = subjectProgress.reduce((sum, subject) => sum + subject.progressPercentage, 0);
    return Math.round(totalProgress / subjectProgress.length);
  };
  
  const pieData = subjectProgress.map(subject => ({
    name: subject.subject,
    value: subject.interestScore,
    color: subject.color,
    activities: subject.totalActivities
  }));

  const activityData = subjectProgress.map(subject => ({
    subject: subject.subject.substring(0, 4),
    notes: subject.activities.notesCreated,
    quizzes: subject.activities.quizzesTaken,
    teaching: subject.activities.interactiveTeaching,
    sessions: subject.activities.studySessions,
    chapters: subject.activities.chaptersRead
  }));

  return (
    <CardContent className="p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            संपूर्ण अध्ययन प्रगति
          </h3>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {calculateOverallProgress()}% पूर्ण
          </Badge>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : totalActivities === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">अभी तक कोई गतिविधि ट्रैक नहीं हुई</p>
            <p className="text-sm text-gray-500">नोट्स बनाएं, क्विज़ लें, या interactive teaching का उपयोग करें</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalActivities}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">कुल गतिविधियां</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-700 dark:text-green-300">{totalStudyTime}</div>
                <div className="text-xs text-green-600 dark:text-green-400">अध्ययन मिनट</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{Math.round(averageConsistency)}%</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">नियमितता</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interest Distribution */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  विषयों में रुचि
                </h4>
                
                <div className="aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} रुचि स्कोर`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Activity Distribution */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                  <BarChart className="h-4 w-4" />
                  गतिविधि वितरण
                </h4>
                
                <div className="aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="notes" 
                        stackId="1" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="quizzes" 
                        stackId="1" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="teaching" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Detailed Subject Progress */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                विस्तृत विषयवार प्रगति
              </h4>
              
              {subjectProgress.map((subject, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" style={{ color: subject.color }}>{subject.subject}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" style={{ borderColor: subject.color, color: subject.color }}>
                        {subject.knowledgeLevel}
                      </Badge>
                      <span className="text-sm text-gray-600">{subject.progressPercentage}%</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={subject.progressPercentage} 
                    className="h-2 mb-3"
                    style={{ backgroundColor: `${subject.color}20` }}
                  />
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <div>
                      <div className="font-medium mb-1">गतिविधि विवरण:</div>
                      <div>नोट्स: {subject.activities.notesCreated}</div>
                      <div>क्विज़: {subject.activities.quizzesTaken}</div>
                      <div>इंटरएक्टिव: {subject.activities.interactiveTeaching}</div>
                      <div>अध्याय: {subject.activities.chaptersRead}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">प्रदर्शन:</div>
                      <div>अध्ययन समय: {subject.studyTimeMinutes} मिनट</div>
                      <div>सटीकता: {subject.averageAccuracy}%</div>
                      <div>रुचि स्कोर: {subject.interestScore}</div>
                      <div>नियमितता: {subject.consistencyScore}%</div>
                    </div>
                  </div>
                  
                  {subject.strongTopics.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs font-medium text-green-600">मजबूत विषय:</span>
                        {subject.strongTopics.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </CardContent>
  );
};

export default ComprehensiveStudentProgress;
