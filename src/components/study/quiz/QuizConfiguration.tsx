import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Clock, BookOpen, Target, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizConfigurationProps {
  topic: string;
  setTopic: (topic: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
  quizType: string;
  setQuizType: (type: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  numberOfQuestions: number;
  setNumberOfQuestions: (count: number) => void;
  timeLimit: number;
  setTimeLimit: (time: number) => void;
  includeExplanations: boolean;
  setIncludeExplanations: (include: boolean) => void;
  focusArea: string;
  setFocusArea: (area: string) => void;
  onGenerateSample: () => void;
}

const QuizConfiguration: React.FC<QuizConfigurationProps> = ({
  topic,
  setTopic,
  selectedSubject,
  setSelectedSubject,
  quizType,
  setQuizType,
  difficulty,
  setDifficulty,
  numberOfQuestions,
  setNumberOfQuestions,
  timeLimit,
  setTimeLimit,
  includeExplanations,
  setIncludeExplanations,
  focusArea,
  setFocusArea,
  onGenerateSample
}) => {
  const { t, language } = useLanguage();

  // Question count options for select dropdown
  const questionCountOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  // Time limit options
  const timeLimitOptions = [
    { value: 0, label: language === 'en' ? 'No limit' : 'कोई सीमा नहीं' },
    { value: 5, label: `5 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 10, label: `10 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 15, label: `15 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 30, label: `30 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 45, label: `45 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 60, label: `60 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 90, label: `90 ${language === 'en' ? 'minutes' : 'मिनट'}` },
    { value: 120, label: `120 ${language === 'en' ? 'minutes' : 'मिनट'}` }
  ];

  const subjects = [
    { id: 'general', name: language === 'en' ? 'General Knowledge' : 'सामान्य ज्ञान' },
    { id: 'gk', name: language === 'en' ? 'General Awareness (GK)' : 'सामान्य जागरूकता (जीके)' },
    { id: 'gs', name: language === 'en' ? 'General Studies (GS)' : 'सामान्य अध्ययन (जीएस)' },
    { id: 'current-affairs', name: language === 'en' ? 'Current Affairs' : 'समसामयिक घटनाएं' },
    { id: 'hindi', name: language === 'en' ? 'Hindi Language' : 'हिंदी भाषा' },
    { id: 'english', name: language === 'en' ? 'English Language' : 'अंग्रेजी भाषा' },
    { id: 'mathematics', name: language === 'en' ? 'Mathematics' : 'गणित' },
    { id: 'science', name: language === 'en' ? 'General Science' : 'सामान्य विज्ञान' },
    { id: 'physics', name: language === 'en' ? 'Physics' : 'भौतिकी' },
    { id: 'chemistry', name: language === 'en' ? 'Chemistry' : 'रसायन शास्त्र' },
    { id: 'biology', name: language === 'en' ? 'Biology' : 'जीव विज्ञान' },
    { id: 'history', name: language === 'en' ? 'History' : 'इतिहास' },
    { id: 'geography', name: language === 'en' ? 'Geography' : 'भूगोल' },
    { id: 'polity', name: language === 'en' ? 'Political Science/Polity' : 'राजनीति विज्ञान' },
    { id: 'economics', name: language === 'en' ? 'Economics' : 'अर्थशास्त्र' },
    { id: 'sociology', name: language === 'en' ? 'Sociology' : 'समाजशास्त्र' },
    { id: 'psychology', name: language === 'en' ? 'Psychology' : 'मनोविज्ञान' },
    { id: 'philosophy', name: language === 'en' ? 'Philosophy' : 'दर्शनशास्त्र' },
    { id: 'literature', name: language === 'en' ? 'Literature' : 'साहित्य' },
    { id: 'computer', name: language === 'en' ? 'Computer Science/IT' : 'कंप्यूटर विज्ञान/आईटी' },
    { id: 'environment', name: language === 'en' ? 'Environment & Ecology' : 'पर्यावरण एवं पारिस्थितिकी' },
    { id: 'indian-culture', name: language === 'en' ? 'Indian Art & Culture' : 'भारतीय कला एवं संस्कृति' },
    { id: 'sports', name: language === 'en' ? 'Sports & Games' : 'खेल एवं खिलाड़ी' },
    { id: 'awards', name: language === 'en' ? 'Awards & Honors' : 'पुरस्कार एवं सम्मान' },
    { id: 'books-authors', name: language === 'en' ? 'Books & Authors' : 'पुस्तकें एवं लेखक' },
    { id: 'reasoning', name: language === 'en' ? 'Logical Reasoning' : 'तार्किक विवेचन' },
    { id: 'quantitative', name: language === 'en' ? 'Quantitative Aptitude' : 'मात्रात्मक योग्यता' },
    { id: 'banking', name: language === 'en' ? 'Banking & Finance' : 'बैंकिंग एवं वित्त' },
    { id: 'railway', name: language === 'en' ? 'Railway Exams' : 'रेलवे परीक्षा' },
    { id: 'ssc', name: language === 'en' ? 'SSC Exams' : 'एसएससी परीक्षा' },
    { id: 'upsc', name: language === 'en' ? 'UPSC/Civil Services' : 'यूपीएससी/सिविल सेवा' },
    { id: 'defence', name: language === 'en' ? 'Defence Exams' : 'रक्षा परीक्षा' }
  ];

  const quizTypes = [
    { id: 'multiple-choice', name: language === 'en' ? 'Multiple Choice' : 'बहुविकल्पीय' },
    { id: 'true-false', name: language === 'en' ? 'True/False' : 'सही/गलत' },
    { id: 'short-answer', name: language === 'en' ? 'Short Answer' : 'लघु उत्तर' },
    { id: 'fill-blanks', name: language === 'en' ? 'Fill in the Blanks' : 'रिक्त स्थान भरें' },
    { id: 'matching', name: language === 'en' ? 'Matching' : 'मिलान' },
    { id: 'flashcards', name: language === 'en' ? 'Flashcards' : 'फ्लैशकार्ड' },
  ];

  const focusAreas = [
    { id: 'balanced', name: language === 'en' ? 'Balanced Mix' : 'संतुलित मिश्रण' },
    { id: 'conceptual', name: language === 'en' ? 'Conceptual Understanding' : 'वैचारिक समझ' },
    { id: 'application', name: language === 'en' ? 'Practical Application' : 'व्यावहारिक अनुप्रयोग' },
    { id: 'memorization', name: language === 'en' ? 'Memory & Facts' : 'स्मृति और तथ्य' },
    { id: 'analysis', name: language === 'en' ? 'Critical Analysis' : 'आलोचनात्मक विश्लेषण' },
  ];

  return (
    <div className="space-y-6">
      {/* Smart Recommendations Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800 dark:text-orange-300">
            {language === 'en' ? 'Smart Recommendations' : 'स्मार्ट सुझाव'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div className="bg-white dark:bg-gray-800 p-2 rounded border">
            <div className="font-medium text-green-700 dark:text-green-400">
              {language === 'en' ? '🎯 Beginner' : '🎯 शुरुआती'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              5-10 {language === 'en' ? 'questions' : 'प्रश्न'} • 10-15 {language === 'en' ? 'min' : 'मिनट'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded border">
            <div className="font-medium text-blue-700 dark:text-blue-400">
              {language === 'en' ? '📚 Practice' : '📚 अभ्यास'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              15-25 {language === 'en' ? 'questions' : 'प्रश्न'} • 20-30 {language === 'en' ? 'min' : 'मिनट'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded border">
            <div className="font-medium text-purple-700 dark:text-purple-400">
              {language === 'en' ? '🏆 Expert' : '🏆 विशेषज्ञ'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              30-50 {language === 'en' ? 'questions' : 'प्रश्न'} • 45-60 {language === 'en' ? 'min' : 'मिनट'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <label htmlFor="topic" className="block text-sm font-semibold mb-2 text-blue-800 dark:text-blue-300">
              {t('topic')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                id="topic"
                placeholder={t('topicPlaceholder')}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1 border-blue-300 focus:border-blue-500"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onGenerateSample}
                className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                title={language === 'en' ? 'Generate sample topic' : 'नमूना विषय उत्पन्न करें'}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="subject" className="flex items-center gap-2 text-sm font-medium mb-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                {language === 'en' ? 'Subject Category' : 'विषय श्रेणी'}
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full border-purple-300 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="quizType" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Zap className="h-4 w-4 text-indigo-600" />
                {language === 'en' ? 'Quiz Type' : 'प्रश्नोत्तरी प्रकार'}
              </label>
              <Select value={quizType} onValueChange={setQuizType}>
                <SelectTrigger className="w-full border-indigo-300 focus:border-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quizTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="difficulty" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Target className="h-4 w-4 text-green-600" />
                {t('difficulty')}
              </label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full border-green-300 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">●</span>
                      {t('easy')}
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">●</span>
                      {t('medium')}
                    </div>
                  </SelectItem>
                  <SelectItem value="hard">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">●</span>
                      {t('hard')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="questions" className="flex items-center gap-2 text-sm font-medium mb-2">
                <span className="text-blue-600 font-bold">#</span>
                {t('numberOfQuestions')}
              </label>
              <Select 
                value={numberOfQuestions.toString()} 
                onValueChange={(value) => setNumberOfQuestions(Number(value))}
              >
                <SelectTrigger className="w-full border-blue-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionCountOptions.map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{count} {language === 'en' ? 'Questions' : 'प्रश्न'}</span>
                        {count <= 10 && <span className="text-green-500 text-xs">Quick</span>}
                        {count >= 30 && <span className="text-purple-500 text-xs">Expert</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="focusArea" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Target className="h-4 w-4 text-orange-600" />
                {language === 'en' ? 'Focus Area' : 'फोकस क्षेत्र'}
              </label>
              <Select value={focusArea} onValueChange={setFocusArea}>
                <SelectTrigger className="w-full border-orange-300 focus:border-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {focusAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="timeLimit" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="h-4 w-4 text-red-600" />
                {language === 'en' ? 'Time Limit' : 'समय सीमा'}
              </label>
              <Select 
                value={timeLimit.toString()} 
                onValueChange={(value) => setTimeLimit(Number(value))}
              >
                <SelectTrigger className="w-full border-red-300 focus:border-red-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeLimitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div className="flex items-center gap-2">
                        {option.value === 0 ? (
                          <span className="text-green-500">∞</span>
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={includeExplanations}
              onChange={(e) => setIncludeExplanations(e.target.checked)}
              className="rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-green-800 dark:text-green-300">
              {language === 'en' ? 'Include detailed explanations for answers' : 'उत्तरों के लिए विस्तृत व्याख्या शामिल करें'}
            </span>
          </label>
          <div className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800/30 px-2 py-1 rounded">
            {language === 'en' ? 'Recommended for better learning' : 'बेहतर सीखने के लिए अनुशंसित'}
          </div>
        </div>
      </div>

      {/* Quick Setup Suggestions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-sm font-semibold mb-3 text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          {language === 'en' ? 'Quick Setup' : 'त्वरित सेटअप'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNumberOfQuestions(10);
              setTimeLimit(15);
              setDifficulty('easy');
            }}
            className="text-xs border-green-300 text-green-700 hover:bg-green-50"
          >
            🎯 {language === 'en' ? 'Quick Test' : 'त्वरित टेस्ट'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNumberOfQuestions(25);
              setTimeLimit(30);
              setDifficulty('medium');
            }}
            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            📚 {language === 'en' ? 'Practice Mode' : 'अभ्यास मोड'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNumberOfQuestions(50);
              setTimeLimit(60);
              setDifficulty('hard');
            }}
            className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            🏆 {language === 'en' ? 'Challenge Mode' : 'चुनौती मोड'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizConfiguration;
