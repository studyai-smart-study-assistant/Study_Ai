import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, RefreshCw, Sparkles, BookOpenCheck, GraduationCap, Zap, Settings, BarChart3, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizTemplates from './quiz/QuizTemplates';
import QuizProgress from './quiz/QuizProgress';
import QuizResults from './quiz/QuizResults';
import QuizConfiguration from './quiz/QuizConfiguration';
import QuizStats from './quiz/QuizStats';
import InteractiveQuiz from './InteractiveQuiz';

interface QuizGeneratorProps {
  onSendMessage: (message: string) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onSendMessage }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [quizType, setQuizType] = useState('multiple-choice');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('general');
  const [activeTab, setActiveTab] = useState('generate');
  const [timeLimit, setTimeLimit] = useState(0);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [focusArea, setFocusArea] = useState('balanced');
  const [quizMode, setQuizMode] = useState<'traditional' | 'interactive'>('traditional');
  
  // Quiz session state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Mock quiz statistics
  const [quizStats] = useState({
    totalQuizzes: 23,
    averageScore: 78,
    totalTimeSpent: 145,
    favoriteSubject: 'Mathematics',
    streak: 5
  });

  const { t, language } = useLanguage();

  const handleSelectTemplate = (template: any) => {
    setTopic(template.topic);
    setSelectedSubject(template.subject);
    setDifficulty(template.difficulty);
    setNumberOfQuestions(template.questions);
    setActiveTab('generate');
    toast.success(language === 'en' ? 'Template loaded!' : 'टेम्प्लेट लोड किया गया!');
  };

  const handleGenerateQuiz = () => {
    if (!topic.trim()) {
      toast.error(language === 'en' ? 'Please enter a topic for the quiz' : 'कृपया क्विज के लिए एक विषय दर्ज करें');
      return;
    }

    // Validation for question count
    if (numberOfQuestions > 50) {
      toast.error(language === 'en' ? 'Maximum 50 questions allowed' : 'अधिकतम 50 प्रश्न की अनुमति है');
      return;
    }

    setIsLoading(true);
    
    // Create more specific and optimized prompt
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
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || selectedSubject;
    const difficultyLevel = difficulty === 'easy' ? (language === 'en' ? 'beginner' : 'आसान') : 
                           difficulty === 'medium' ? (language === 'en' ? 'intermediate' : 'मध्यम') : 
                           (language === 'en' ? 'advanced' : 'कठिन');
    
    let prompt = '';
    
    if (language === 'en') {
      prompt = `Create an educational quiz with the following specifications:

TOPIC: "${topic}"
SUBJECT CATEGORY: ${subjectName}
DIFFICULTY LEVEL: ${difficultyLevel}
NUMBER OF QUESTIONS: ${numberOfQuestions}
QUIZ TYPE: ${quizType}
${timeLimit > 0 ? `TIME LIMIT: ${timeLimit} minutes` : ''}
${includeExplanations ? 'INCLUDE: Detailed explanations for each answer' : ''}
${focusArea !== 'balanced' ? `FOCUS: Primarily ${focusArea} based questions` : ''}

FORMATTING REQUIREMENTS:
1. Number each question clearly (1., 2., 3., etc.)
2. For multiple choice: Use options A, B, C, D
3. Mark correct answer clearly with "Correct Answer: [Letter]"
4. Provide explanation after each answer
5. Ensure questions are unique and non-repetitive
6. Cover different aspects of the topic
7. Use appropriate difficulty progression

QUALITY STANDARDS:
- Questions should be educationally valuable
- Avoid repetitive themes or patterns
- Include variety in question types within the format
- Ensure factual accuracy
- Make questions engaging and thought-provoking

Generate exactly ${numberOfQuestions} questions following these guidelines.`;
    } else {
      prompt = `निम्नलिखित विशिष्टताओं के साथ एक शैक्षणिक प्रश्नोत्तरी बनाएं:

विषय: "${topic}"
विषय श्रेणी: ${subjectName}
कठिनाई स्तर: ${difficultyLevel}
प्रश्नों की संख्या: ${numberOfQuestions}
क्विज प्रकार: ${quizType === 'multiple-choice' ? 'बहुविकल्पीय' : quizType === 'true-false' ? 'सही/गलत' : 'अन्य'}
${timeLimit > 0 ? `समय सीमा: ${timeLimit} मिनट` : ''}
${includeExplanations ? 'शामिल करें: प्रत्येक उत्तर के लिए विस्तृत व्याख्या' : ''}
${focusArea !== 'balanced' ? `फोकस: मुख्यतः ${focusArea} आधारित प्रश्न` : ''}

प्रारूप आवश्यकताएं:
1. प्रत्येक प्रश्न को स्पष्ट रूप से क्रमांकित करें (1., 2., 3., आदि)
2. बहुविकल्पीय के लिए: विकल्प A, B, C, D का उपयोग करें
3. सही उत्तर को स्पष्ट रूप से चिह्नित करें "सही उत्तर: [अक्षर]"
4. प्रत्येक उत्तर के बाद व्याख्या प्रदान करें
5. सुनिश्चित करें कि प्रश्न अनूठे हैं और दोहराए नहीं गए हैं
6. विषय के विभिन्न पहलुओं को कवर करें
7. उपयुक्त कठिनाई प्रगति का उपयोग करें

गुणवत्ता मानक:
- प्रश्न शैक्षणिक रूप से मूल्यवान होने चाहिए
- दोहराए जाने वाले विषयों या पैटर्न से बचें
- प्रारूप के भीतर प्रश्न प्रकारों में विविधता शामिल करें
- तथ्यात्मक सटीकता सुनिश्चित करें
- प्रश्नों को आकर्षक और विचारोत्तेजक बनाएं

इन दिशानिर्देशों का पालन करते हुए ठीक ${numberOfQuestions} प्रश्न बनाएं।`;
    }
    
    // Add uniqueness instruction to avoid repetitive questions
    const uniquenessInstruction = language === 'en' ? 
      `\n\nIMPORTANT: Create completely unique questions. Avoid similar patterns, repeated concepts, or identical question structures. Each question should test different aspects of ${topic}.` :
      `\n\nमहत्वपूर्ण: बिल्कुल अनूठे प्रश्न बनाएं। समान पैटर्न, दोहराए गए अवधारणाओं, या समान प्रश्न संरचनाओं से बचें। प्रत्येक प्रश्न को ${topic} के विभिन्न पहलुओं का परीक्षण करना चाहिए।`;
    
    prompt += uniquenessInstruction;
    
    console.log('Sending quiz generation request:', { topic, numberOfQuestions, difficulty, selectedSubject });
    
    onSendMessage(prompt);
    setIsLoading(false);
    
    // Start quiz session
    setIsQuizActive(true);
    setCurrentQuestion(1);
    setTimeElapsed(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setShowResults(false);
    setActiveTab('progress');
    
    toast.success(
      language === 'en' 
        ? `Generating ${numberOfQuestions} questions on ${topic}...` 
        : `${topic} पर ${numberOfQuestions} प्रश्न जनरेट हो रहे हैं...`
    );
  };

  const generateSampleQuestions = () => {
    const sampleTopics = [
      language === 'en' ? 'Indian Constitution and Fundamental Rights' : 'भारतीय संविधान और मौलिक अधिकार',
      language === 'en' ? 'World History - World War II' : 'विश्व इतिहास - द्वितीय विश्व युद्ध',
      language === 'en' ? 'Indian Geography - Rivers and Mountains' : 'भारतीय भूगोल - नदियां और पर्वत',
      language === 'en' ? 'General Science - Physics Laws' : 'सामान्य विज्ञान - भौतिकी के नियम',
      language === 'en' ? 'Current Affairs - Recent Government Schemes' : 'समसामयिक घटनाएं - हाल की सरकारी योजनाएं',
      language === 'en' ? 'Indian Culture and Heritage' : 'भारतीय संस्कृति और विरासत',
      language === 'en' ? 'Economics - Banking and Finance' : 'अर्थशास्त्र - बैंकिंग और वित्त',
      language === 'en' ? 'Environmental Science and Climate Change' : 'पर्यावरण विज्ञान और जलवायु परिवर्तन',
      language === 'en' ? 'Computer Fundamentals and Internet' : 'कंप्यूटर की बुनियादी बातें और इंटरनेट',
      language === 'en' ? 'Sports and International Games' : 'खेल और अंतर्राष्ट्रीय खेल'
    ];
    
    setTopic(sampleTopics[Math.floor(Math.random() * sampleTopics.length)]);
  };

  const handleRetakeQuiz = () => {
    setIsQuizActive(true);
    setCurrentQuestion(1);
    setTimeElapsed(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setShowResults(false);
    setActiveTab('progress');
  };

  const handleNewQuiz = () => {
    setIsQuizActive(false);
    setShowResults(false);
    setActiveTab('generate');
    setTopic('');
  };

  const finishQuiz = () => {
    setIsQuizActive(false);
    setShowResults(true);
    setActiveTab('results');
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow border-2 border-purple-100 dark:border-purple-900">
      <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-blue-900/30 rounded-t-lg border-b border-purple-200 dark:border-purple-800">
        <CardTitle className="flex items-center gap-3 text-purple-800 dark:text-purple-300">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{t('quizGenerator')}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-1 rounded-full font-medium">
                {language === 'en' ? 'Enhanced & Optimized' : 'उन्नत और अनुकूलित'}
              </span>
              <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-purple-700 dark:text-purple-400">
          {language === 'en' 
            ? 'Create comprehensive quizzes with 50+ subjects, advanced error handling, and unique question generation'
            : '50+ विषयों, उन्नत त्रुटि हैंडलिंग और अनूठे प्रश्न जेनरेशन के साथ व्यापक क्विज़ बनाएं'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {/* Quiz Mode Selection */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <h3 className="text-lg font-semibold mb-4 text-center">
            {language === 'en' ? 'Choose Quiz Mode' : 'क्विज़ मोड चुनें'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={quizMode === 'traditional' ? 'default' : 'outline'}
              onClick={() => setQuizMode('traditional')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <BookOpenCheck className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">
                  {language === 'en' ? 'Traditional Mode' : 'पारंपरिक मोड'}
                </div>
                <div className="text-xs opacity-70">
                  {language === 'en' ? 'Q&A format in chat' : 'चैट में प्रश्न-उत्तर प्रारूप'}
                </div>
              </div>
            </Button>
            
            <Button
              variant={quizMode === 'interactive' ? 'default' : 'outline'}
              onClick={() => setQuizMode('interactive')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <PlayCircle className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">
                  {language === 'en' ? 'Interactive Test' : 'इंटरैक्टिव टेस्ट'}
                </div>
                <div className="text-xs opacity-70">
                  {language === 'en' ? 'Live test with timer' : 'टाइमर के साथ लाइव टेस्ट'}
                </div>
              </div>
            </Button>
          </div>
        </div>

        {quizMode === 'interactive' ? (
          <div className="p-6">
            <InteractiveQuiz />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-0 rounded-none border-b bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <TabsTrigger value="templates" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                <BookOpenCheck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{language === 'en' ? 'Templates' : 'टेम्प्लेट'}</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{language === 'en' ? 'Generate' : 'जनरेट'}</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800" disabled={!isQuizActive}>
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{language === 'en' ? 'Progress' : 'प्रगति'}</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800" disabled={!showResults}>
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{language === 'en' ? 'Results' : 'परिणाम'}</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{language === 'en' ? 'Stats' : 'आंकड़े'}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="p-6 mt-0">
              <QuizTemplates onSelectTemplate={handleSelectTemplate} />
            </TabsContent>
            
            <TabsContent value="generate" className="p-6 mt-0">
              <QuizConfiguration
                topic={topic}
                setTopic={setTopic}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                quizType={quizType}
                setQuizType={setQuizType}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                numberOfQuestions={numberOfQuestions}
                setNumberOfQuestions={setNumberOfQuestions}
                timeLimit={timeLimit}
                setTimeLimit={setTimeLimit}
                includeExplanations={includeExplanations}
                setIncludeExplanations={setIncludeExplanations}
                focusArea={focusArea}
                setFocusArea={setFocusArea}
                onGenerateSample={generateSampleQuestions}
              />
            </TabsContent>
            
            <TabsContent value="progress" className="p-6 mt-0">
              {isQuizActive && (
                <QuizProgress
                  currentQuestion={currentQuestion}
                  totalQuestions={numberOfQuestions}
                  timeElapsed={timeElapsed}
                  correctAnswers={correctAnswers}
                  wrongAnswers={wrongAnswers}
                />
              )}
              <div className="mt-6 text-center">
                <Button 
                  onClick={finishQuiz} 
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {language === 'en' ? 'Finish Quiz' : 'क्विज समाप्त करें'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="p-6 mt-0">
              {showResults && (
                <QuizResults
                  score={correctAnswers}
                  totalQuestions={numberOfQuestions}
                  timeElapsed={timeElapsed}
                  difficulty={difficulty}
                  topic={topic}
                  onRetakeQuiz={handleRetakeQuiz}
                  onGenerateNewQuiz={handleNewQuiz}
                />
              )}
            </TabsContent>

            <TabsContent value="stats" className="p-6 mt-0">
              <QuizStats
                totalQuizzes={quizStats.totalQuizzes}
                averageScore={quizStats.averageScore}
                totalTimeSpent={quizStats.totalTimeSpent}
                favoriteSubject={quizStats.favoriteSubject}
                streak={quizStats.streak}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      {activeTab === 'generate' && quizMode === 'traditional' && (
        <CardFooter className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-b-lg pt-6 border-t border-purple-200 dark:border-purple-800">
          <Button 
            onClick={handleGenerateQuiz} 
            disabled={isLoading || !topic.trim()} 
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                {t('processing')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {t('generateQuiz')}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuizGenerator;
