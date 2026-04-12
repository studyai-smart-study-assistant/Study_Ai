
import React, { useState, useEffect, useCallback } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, BarChart, Clock, Trophy } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface StudentLearningProgressProps {
  currentUser: { uid: string } | null;
}

interface SubjectProgress {
  name: string;
  progress: number;
  color: string;
  totalQuestions: number;
  correctAnswers: number;
  studyTime: number;
}

interface WeeklyActivity {
  day: string;
  points: number;
  studyTime: number;
  quizzes: number;
}

interface PointsHistoryItem {
  timestamp?: string;
  type?: string;
  points?: number;
  description?: string;
}

interface ChatMessageItem {
  sender?: string;
  content?: string;
}

interface ChatHistoryItem {
  messages?: ChatMessageItem[];
}

interface StudySessionItem {
  duration?: number;
  date?: string;
  timestamp?: string;
}

interface QuizResultItem {
  subject?: string;
  topic?: string;
  totalQuestions?: number;
  correctAnswers?: number;
}

const parseStoredArray = <T,>(value: string | null): T[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const StudentLearningProgress: React.FC<StudentLearningProgressProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [achievements, setAchievements] = useState<number>(0);
  const [totalStudyTime, setTotalStudyTime] = useState<number>(0);
  
  const subjectColors = [
    '#8b5cf6', // Purple - गणित
    '#3b82f6', // Blue - विज्ञान  
    '#ef4444', // Red - हिंदी
    '#10b981', // Green - अंग्रेजी
    '#f97316', // Orange - सामाजिक विज्ञान
    '#0ea5e9', // Light blue - अन्य विषय
  ];

  const subjectKeywords = {
    'गणित': ['math', 'गणित', 'अंक', 'संख्या', 'गुणा', 'भाग', 'जोड़', 'घटाव', 'algebra', 'geometry'],
    'विज्ञान': ['science', 'विज्ञान', 'भौतिक', 'रसायन', 'जीव', 'physics', 'chemistry', 'biology'],
    'हिंदी': ['hindi', 'हिंदी', 'व्याकरण', 'साहित्य', 'कविता', 'गद्य', 'grammar'],
    'अंग्रेजी': ['english', 'अंग्रेजी', 'grammar', 'literature', 'essay', 'poem'],
    'सामाजिक विज्ञान': ['social', 'सामाजिक', 'इतिहास', 'भूगोल', 'राजनीति', 'history', 'geography'],
    'अन्य विषय': ['other', 'अन्य', 'general', 'सामान्य']
  };
  
  const analyzeMessageContent = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return subject;
      }
    }
    
    return 'अन्य विषय';
  };

  const calculateSubjectProgress = (
    pointsHistory: PointsHistoryItem[],
    chatHistory: ChatHistoryItem[],
    quizResults: QuizResultItem[],
  ) => {
    const subjectData: { [key: string]: SubjectProgress } = {};
    
    Object.keys(subjectKeywords).forEach((subject, index) => {
      subjectData[subject] = {
        name: subject,
        progress: 0,
        color: subjectColors[index] || subjectColors[5],
        totalQuestions: 0,
        correctAnswers: 0,
        studyTime: 0
      };
    });
    
    chatHistory.forEach((chat) => {
      if (chat.messages) {
        chat.messages.forEach((message) => {
          if (message.sender === 'user') {
            const subject = analyzeMessageContent(message.content || '');
            subjectData[subject].totalQuestions += 1;
            if ((message.content || '').length > 50) {
              subjectData[subject].correctAnswers += 1;
            }
          }
        });
      }
    });
    
    quizResults.forEach((quiz) => {
      const subject = quiz.subject || analyzeMessageContent(quiz.topic || '');
      if (subjectData[subject]) {
        subjectData[subject].totalQuestions += quiz.totalQuestions || 0;
        subjectData[subject].correctAnswers += quiz.correctAnswers || 0;
      }
    });
    
    pointsHistory.forEach((item) => {
      if (item.description) {
        const subject = analyzeMessageContent(item.description);
        subjectData[subject].studyTime += item.points || 0;
      }
    });
    
    return Object.values(subjectData)
      .filter(subject => subject.totalQuestions > 0 || subject.studyTime > 0)
      .map(subject => ({
        ...subject,
        progress: subject.totalQuestions > 0 
          ? Math.round((subject.correctAnswers / subject.totalQuestions) * 100)
          : Math.min(subject.studyTime, 100)
      }));
  };

  const calculateWeeklyActivity = (pointsHistory: PointsHistoryItem[], studySessions: StudySessionItem[]) => {
    const days = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
    const weeklyData: { [key: string]: WeeklyActivity } = {};
    
    // Initialize days
    days.forEach(day => {
      weeklyData[day] = { day, points: 0, studyTime: 0, quizzes: 0 };
    });
    
    const now = new Date();
    const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Aggregate points from last 7 days
    pointsHistory.forEach((item) => {
      const itemDate = new Date(item.timestamp);
      if (itemDate >= weekStart) {
        const dayIndex = itemDate.getDay();
        const dayName = days[dayIndex];
        weeklyData[dayName].points += item.points || 0;
        
        if (item.type === 'quiz') {
          weeklyData[dayName].quizzes += 1;
        }
      }
    });
    
    // Aggregate study time from last 7 days
    studySessions.forEach((session) => {
      const sessionDate = new Date(session.date || session.timestamp);
      if (sessionDate >= weekStart) {
        const dayIndex = sessionDate.getDay();
        const dayName = days[dayIndex];
        weeklyData[dayName].studyTime += Math.floor((session.duration || 0) / 60);
      }
    });
    
    return Object.values(weeklyData);
  };

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const loadProgress = async () => {
      try {
        const pointsHistory = parseStoredArray<PointsHistoryItem>(localStorage.getItem(`${currentUser.uid}_points_history`));
        const studySessions = parseStoredArray<StudySessionItem>(localStorage.getItem(`${currentUser.uid}_study_sessions`));
        const quizResults = parseStoredArray<QuizResultItem>(localStorage.getItem(`${currentUser.uid}_quiz_results`));

        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', currentUser.uid);

        if (conversationsError) throw conversationsError;

        const conversationIds = (conversations ?? []).map((conversation) => conversation.id);
        let chatHistory: ChatHistoryItem[] = [];

        if (conversationIds.length > 0) {
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('chat_id, message_type, text_content')
            .in('chat_id', conversationIds)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;

          const grouped = new Map<string, ChatMessageItem[]>();
          (messagesData ?? []).forEach((message) => {
            const list = grouped.get(message.chat_id) ?? [];
            const sender = message.message_type === 'bot' ? 'bot' : 'user';
            list.push({ sender, content: message.text_content || '' });
            grouped.set(message.chat_id, list);
          });

          chatHistory = Array.from(grouped.values()).map((messages) => ({ messages }));
        }

        setSubjectProgress(calculateSubjectProgress(pointsHistory, chatHistory, quizResults));
        setWeeklyActivity(calculateWeeklyActivity(pointsHistory, studySessions));
        setTotalStudyTime(Math.floor(studySessions.reduce((t, s) => t + (s.duration || 0), 0) / 60));
        setAchievements(pointsHistory.filter(i => ['achievement','quiz','streak','goal_completed'].includes(i.type || '')).length);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadProgress();
  }, [currentUser]);

  const calculateOverallProgress = () => {
    if (subjectProgress.length === 0) return 0;
    const totalProgress = subjectProgress.reduce((sum, subject) => sum + subject.progress, 0);
    return Math.round(totalProgress / subjectProgress.length);
  };
  
  const pieData = subjectProgress.map(subject => ({
    name: subject.name,
    value: subject.progress,
    color: subject.color
  }));

  return (
    <CardContent className="p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="h-5 w-5 text-purple-600" />
            वास्तविक अध्ययन प्रगति
          </h3>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {calculateOverallProgress()}% पूर्ण
          </Badge>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : subjectProgress.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">अभी तक कोई अध्ययन डेटा नहीं मिला</p>
            <p className="text-sm text-gray-500">क्विज़ लें, चैट करें, या अध्ययन सत्र शुरू करें ताकि आपकी प्रगति ट्रैक हो सके</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  विषयवार प्रगति
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
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  साप्ताहिक गतिविधि
                </h4>
                
                <div className="aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyActivity}>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `${value} पॉइंट्स`} />
                      <Line 
                        type="monotone" 
                        dataKey="points" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        dot={{ fill: '#8b5cf6' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  वास्तविक उपलब्धियां
                </h4>
                <span className="text-sm">{achievements}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div>कुल अध्ययन समय: {totalStudyTime} मिनट</div>
                <div>सक्रिय विषय: {subjectProgress.length}</div>
              </div>
              
              <div className="space-y-4">
                {subjectProgress.map((subject, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{subject.name}</span>
                      <div className="text-xs text-gray-500">
                        {subject.progress}% • {subject.totalQuestions} प्रश्न • {subject.correctAnswers} सही
                      </div>
                    </div>
                    <Progress 
                      value={subject.progress} 
                      className="h-2"
                      style={{ backgroundColor: `${subject.color}20` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </CardContent>
  );
};

export default StudentLearningProgress;
