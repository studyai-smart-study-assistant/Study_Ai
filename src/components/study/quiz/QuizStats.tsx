
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizStatsProps {
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  favoriteSubject: string;
  streak: number;
}

const QuizStats: React.FC<QuizStatsProps> = ({
  totalQuizzes,
  averageScore,
  totalTimeSpent,
  favoriteSubject,
  streak
}) => {
  const { language } = useLanguage();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const stats = [
    {
      icon: <Award className="h-5 w-5 text-yellow-600" />,
      label: language === 'en' ? 'Total Quizzes' : 'कुल क्विज़',
      value: totalQuizzes.toString(),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    {
      icon: <Target className="h-5 w-5 text-green-600" />,
      label: language === 'en' ? 'Average Score' : 'औसत स्कोर',
      value: `${Math.round(averageScore)}%`,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      label: language === 'en' ? 'Time Spent' : 'बिताया गया समय',
      value: formatTime(totalTimeSpent),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      label: language === 'en' ? 'Current Streak' : 'वर्तमान स्ट्रीक',
      value: `${streak} ${language === 'en' ? 'days' : 'दिन'}`,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
        {language === 'en' ? '📊 Your Quiz Statistics' : '📊 आपकी क्विज़ सांख्यिकी'}
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border-2`}>
            <CardContent className="p-3 text-center">
              <div className="flex justify-center mb-2">
                {stat.icon}
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {favoriteSubject && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-800 dark:text-indigo-300">
            <span className="font-medium">
              {language === 'en' ? 'Favorite Subject: ' : 'पसंदीदा विषय: '}
            </span>
            {favoriteSubject}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizStats;
