
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, RotateCcw, Share2, Download, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  timeElapsed: number;
  difficulty: string;
  topic: string;
  onRetakeQuiz: () => void;
  onGenerateNewQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  timeElapsed,
  difficulty,
  topic,
  onRetakeQuiz,
  onGenerateNewQuiz
}) => {
  const { language } = useLanguage();
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', icon: '🏆' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-600', icon: '🌟' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600', icon: '👍' };
    if (percentage >= 60) return { level: 'Fair', color: 'text-orange-600', icon: '📚' };
    return { level: 'Needs Improvement', color: 'text-red-600', icon: '💪' };
  };

  const performance = getPerformanceLevel();

  const shareResults = () => {
    const text = `I just scored ${score}/${totalQuestions} (${percentage}%) on a ${difficulty} ${topic} quiz! 🎯`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success(language === 'en' ? 'Results copied to clipboard!' : 'परिणाम क्लिपबोर्ड पर कॉपी किए गए!');
    }
  };

  const downloadResults = () => {
    const results = `
Quiz Results
============
Topic: ${topic}
Difficulty: ${difficulty}
Score: ${score}/${totalQuestions} (${percentage}%)
Time: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}
Performance: ${performance.level}
Date: ${new Date().toLocaleDateString()}
    `;
    
    const blob = new Blob([results], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full border-2 border-purple-200 dark:border-purple-800 shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {percentage}%
            </div>
            <div className="absolute -top-2 -right-2 text-3xl">
              {performance.icon}
            </div>
          </div>
        </div>
        
        <CardTitle className={`text-2xl ${performance.color} mb-2`}>
          {language === 'en' ? performance.level : 
           performance.level === 'Excellent' ? 'उत्कृष्ट' :
           performance.level === 'Very Good' ? 'बहुत अच्छा' :
           performance.level === 'Good' ? 'अच्छा' :
           performance.level === 'Fair' ? 'ठीक' : 'सुधार की आवश्यकता'}
        </CardTitle>
        
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'en' 
            ? `You scored ${score} out of ${totalQuestions} questions correctly!`
            : `आपने ${totalQuestions} में से ${score} प्रश्न सही किए!`}
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium">{score}/{totalQuestions}</p>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Score' : 'स्कोर'}</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Star className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">{percentage}%</p>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Accuracy' : 'सटीकता'}</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">{difficulty}</p>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Difficulty' : 'कठिनाई'}</p>
          </div>
          
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span className="text-2xl mb-2 block">⏱️</span>
            <p className="text-sm font-medium">
              {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-gray-500">{language === 'en' ? 'Time' : 'समय'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onRetakeQuiz} 
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Retake Quiz' : 'फिर से करें'}
          </Button>
          
          <Button 
            onClick={onGenerateNewQuiz} 
            variant="outline" 
            className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Star className="h-4 w-4 mr-2" />
            {language === 'en' ? 'New Quiz' : 'नई क्विज'}
          </Button>
          
          <Button 
            onClick={shareResults} 
            variant="outline" 
            size="icon"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={downloadResults} 
            variant="outline" 
            size="icon"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            {language === 'en' ? '💡 Study Tips' : '💡 अध्ययन युक्तियाँ'}
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {percentage >= 80 
              ? (language === 'en' 
                ? 'Great job! Try a harder difficulty level to challenge yourself further.'
                : 'बहुत बढ़िया! अपने आप को और चुनौती देने के लिए कठिन स्तर आजमाएं।')
              : (language === 'en'
                ? 'Keep practicing! Review the topics you found challenging and try again.'
                : 'अभ्यास जारी रखें! जिन विषयों में कठिनाई हुई उन्हें दोबारा पढ़ें और पुनः प्रयास करें।')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizResults;
