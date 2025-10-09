import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { generateResponse } from '@/lib/gemini';
import { toast } from 'sonner';
import { addPointsToUser } from '@/utils/points';
import { QuizConfigForm } from './quiz/QuizConfigForm';
import { QuizQuestion } from './quiz/QuizQuestion';
import { QuizResultsView } from './quiz/QuizResultsView';
import { QuizAnswerReview } from './quiz/QuizAnswerReview';
import { parseQuestionsFromResponse } from './quiz/utils';
import { Question, QuizConfig, QuizResult, ReviewAnswer } from './quiz/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Clock, 
  BookOpen, 
  Zap, 
  Target, 
  Trophy,
  Settings,
  Play,
  GraduationCap,
  Star,
  Sparkles
} from 'lucide-react';

const InteractiveQuiz: React.FC = () => {
  const [mode, setMode] = useState<'config' | 'quiz' | 'result' | 'review'>('config');
  const [config, setConfig] = useState<QuizConfig>({
    topic: '',
    subject: 'general',
    language: 'hi',
    questionCount: 5,
    timeLimit: 300
  });
  
  // Enhanced configuration states
  const [selectedClass, setSelectedClass] = useState<string>('none');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [quizType, setQuizType] = useState<string>('mixed');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [focusArea, setFocusArea] = useState<string>('balanced');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswer[]>([]);
  
  // Time tracking states
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  
  const { language } = useLanguage();
  const { currentUser } = useAuth();

  // Question count options for select dropdown
  const questionCountOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

  // Time limit options with better variety
  const timeLimitOptions = [
    { value: 300, label: `5 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 600, label: `10 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 900, label: `15 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 1800, label: `30 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 2700, label: `45 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 3600, label: `60 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 5400, label: `90 ${language === 'hi' ? 'मिनट' : 'minutes'}` },
    { value: 7200, label: `120 ${language === 'hi' ? 'मिनट' : 'minutes'}` }
  ];

  // Enhanced subjects list
  const subjects = [
    { id: 'general', name: language === 'hi' ? 'सामान्य ज्ञान' : 'General Knowledge' },
    { id: 'gk', name: language === 'hi' ? 'सामान्य जागरूकता (जीके)' : 'General Awareness (GK)' },
    { id: 'gs', name: language === 'hi' ? 'सामान्य अध्ययन (जीएस)' : 'General Studies (GS)' },
    { id: 'current-affairs', name: language === 'hi' ? 'समसामयिक घटनाएं' : 'Current Affairs' },
    { id: 'hindi', name: language === 'hi' ? 'हिंदी भाषा' : 'Hindi Language' },
    { id: 'english', name: language === 'hi' ? 'अंग्रेजी भाषा' : 'English Language' },
    { id: 'mathematics', name: language === 'hi' ? 'गणित' : 'Mathematics' },
    { id: 'science', name: language === 'hi' ? 'सामान्य विज्ञान' : 'General Science' },
    { id: 'physics', name: language === 'hi' ? 'भौतिकी' : 'Physics' },
    { id: 'chemistry', name: language === 'hi' ? 'रसायन शास्त्र' : 'Chemistry' },
    { id: 'biology', name: language === 'hi' ? 'जीव विज्ञान' : 'Biology' },
    { id: 'history', name: language === 'hi' ? 'इतिहास' : 'History' },
    { id: 'geography', name: language === 'hi' ? 'भूगोल' : 'Geography' },
    { id: 'polity', name: language === 'hi' ? 'राजनीति विज्ञान' : 'Political Science/Polity' },
    { id: 'economics', name: language === 'hi' ? 'अर्थशास्त्र' : 'Economics' },
    { id: 'sociology', name: language === 'hi' ? 'समाजशास्त्र' : 'Sociology' },
    { id: 'psychology', name: language === 'hi' ? 'मनोविज्ञान' : 'Psychology' },
    { id: 'philosophy', name: language === 'hi' ? 'दर्शनशास्त्र' : 'Philosophy' },
    { id: 'literature', name: language === 'hi' ? 'साहित्य' : 'Literature' },
    { id: 'computer', name: language === 'hi' ? 'कंप्यूटर साइंस/आईटी' : 'Computer Science/IT' },
    { id: 'environment', name: language === 'hi' ? 'पर्यावरण एवं पारिस्थितिकी' : 'Environment & Ecology' },
    { id: 'indian-culture', name: language === 'hi' ? 'भारतीय कला एवं संस्कृति' : 'Indian Art & Culture' },
    { id: 'sports', name: language === 'hi' ? 'खेल एवं खिलाड़ी' : 'Sports & Games' },
    { id: 'awards', name: language === 'hi' ? 'पुरस्कार एवं सम्मान' : 'Awards & Honors' },
    { id: 'books-authors', name: language === 'hi' ? 'पुस्तकें एवं लेखक' : 'Books & Authors' },
    { id: 'reasoning', name: language === 'hi' ? 'तार्किक विवेचन' : 'Logical Reasoning' },
    { id: 'quantitative', name: language === 'hi' ? 'मात्रात्मक योग्यता' : 'Quantitative Aptitude' },
    { id: 'banking', name: language === 'hi' ? 'बैंकिंग एवं वित्त' : 'Banking & Finance' },
    { id: 'railway', name: language === 'hi' ? 'रेलवे परीक्षा' : 'Railway Exams' },
    { id: 'ssc', name: language === 'hi' ? 'एसएससी परीक्षा' : 'SSC Exams' },
    { id: 'upsc', name: language === 'hi' ? 'यूपीएससी/सिविल सेवा' : 'UPSC/Civil Services' },
    { id: 'defence', name: language === 'hi' ? 'रक्षा परीक्षा' : 'Defence Exams' }
  ];

  const focusAreas = [
    { id: 'balanced', name: language === 'hi' ? 'संतुलित मिश्रण' : 'Balanced Mix' },
    { id: 'conceptual', name: language === 'hi' ? 'वैचारिक समझ' : 'Conceptual Understanding' },
    { id: 'application', name: language === 'hi' ? 'व्यावहारिक अनुप्रयोग' : 'Practical Application' },
    { id: 'memorization', name: language === 'hi' ? 'स्मृति और तथ्य' : 'Memory & Facts' },
    { id: 'analysis', name: language === 'hi' ? 'आलोचनात्मक विश्लेषण' : 'Critical Analysis' },
  ];

  const calculateXP = (score: number, totalQuestions: number, timeTaken: number, timeLimit: number): number => {
    const baseXP = score * 2;
    const timeBonus = Math.max(0, Math.floor((timeLimit - timeTaken) / 60) * totalQuestions * 0.1);
    const perfectScoreBonus = score === totalQuestions ? 5 : 0;
    const completionBonus = 5;
    return Math.floor(baseXP + timeBonus + perfectScoreBonus + completionBonus);
  };

  const generateSampleTopic = () => {
    const sampleTopics = [
      language === 'hi' ? 'भारतीय संविधान और मौलिक अधिकार' : 'Indian Constitution and Fundamental Rights',
      language === 'hi' ? 'विश्व इतिहास - द्वितीय विश्व युद्ध' : 'World History - World War II',
      language === 'hi' ? 'भारतीय भूगोल - नदियां और पर्वत' : 'Indian Geography - Rivers and Mountains',
      language === 'hi' ? 'सामान्य विज्ञान - भौतिकी के नियम' : 'General Science - Physics Laws',
      language === 'hi' ? 'समसामयिक घटनाएं - हाल की सरकारी योजनाएं' : 'Current Affairs - Recent Government Schemes',
      language === 'hi' ? 'भारतीय संस्कृति और विरासत' : 'Indian Culture and Heritage',
      language === 'hi' ? 'अर्थशास्त्र - बैंकिंग और वित्त' : 'Economics - Banking and Finance',
      language === 'hi' ? 'पर्यावरण विज्ञान और जलवायु परिवर्तन' : 'Environmental Science and Climate Change',
      language === 'hi' ? 'कंप्यूटर की बुनियादी बातें और इंटरनेट' : 'Computer Fundamentals and Internet',
      language === 'hi' ? 'खेल और अंतर्राष्ट्रीय खेल' : 'Sports and International Games'
    ];
    
    setConfig({...config, topic: sampleTopics[Math.floor(Math.random() * sampleTopics.length)]});
  };

  const generateQuiz = async () => {
    if (!config.topic.trim()) {
      toast.error(language === 'hi' ? 'कृपया एक विषय दर्ज करें' : 'Please enter a topic');
      return;
    }

    if (config.questionCount > 50) {
      toast.error(language === 'hi' ? 'अधिकतम 50 प्रश्न की अनुमति है' : 'Maximum 50 questions allowed');
      return;
    }

    setIsLoading(true);
    try {
      let classContext = '';
      if (selectedClass && selectedClass !== 'none') {
        classContext = `यह ${selectedClass} कक्षा के स्तर के अनुसार प्रश्न बनाएं। `;
      }

      let difficultyContext = '';
      switch (difficulty) {
        case 'easy':
          difficultyContext = 'आसान स्तर के प्रश्न बनाएं जो बुनियादी समझ की जांच करें। ';
          break;
        case 'medium':
          difficultyContext = 'मध्यम स्तर के प्रश्न बनाएं जो अच्छी समझ की आवश्यकता हो। ';
          break;
        case 'hard':
          difficultyContext = 'कठिन स्तर के प्रश्न बनाएं जो गहरी समझ और विश्लेषण की आवश्यकता हो। ';
          break;
      }

      const subjectName = subjects.find(s => s.id === config.subject)?.name || config.subject;

      const prompt = language === 'hi' ? 
        `${classContext}${difficultyContext}${subjectName} विषय पर "${config.topic}" के बारे में ${config.questionCount} बहुविकल्पीय प्रश्न बनाएं।

${customInstructions ? `अतिरिक्त निर्देश: ${customInstructions}` : ''}
${focusArea !== 'balanced' ? `फोकस क्षेत्र: मुख्यतः ${focusAreas.find(f => f.id === focusArea)?.name} आधारित प्रश्न` : ''}

प्रत्येक प्रश्न के लिए:
1. स्पष्ट प्रश्न लिखें
2. चार विकल्प दें (A, B, C, D)
3. सही उत्तर स्पष्ट रूप से बताएं
4. विस्तृत व्याख्या दें कि यह उत्तर सही क्यों है

प्रारूप:
1. प्रश्न यहाँ लिखें?
A. विकल्प 1
B. विकल्प 2  
C. विकल्प 3
D. विकल्प 4
सही उत्तर: A
व्याख्या: विस्तार से बताएं कि यह उत्तर सही क्यों है

महत्वपूर्ण: बिल्कुल अनूठे प्रश्न बनाएं। समान पैटर्न, दोहराए गए अवधारणाओं से बचें। प्रत्येक प्रश्न ${config.topic} के विभिन्न पहलुओं का परीक्षण करे।

कृपया इसी प्रारूप का पालन करें।` :
        `${classContext}${difficultyContext}Create ${config.questionCount} multiple choice questions about "${config.topic}" for ${subjectName} subject.

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}
${focusArea !== 'balanced' ? `Focus area: Primarily ${focusAreas.find(f => f.id === focusArea)?.name} based questions` : ''}

For each question:
1. Write a clear question
2. Provide four options (A, B, C, D)
3. Clearly state the correct answer
4. Give a detailed explanation of why this answer is correct

Format:
1. Question text here?
A. Option 1
B. Option 2
C. Option 3
D. Option 4
Correct Answer: A
Explanation: Detailed explanation of why this answer is correct

IMPORTANT: Create completely unique questions. Avoid similar patterns, repeated concepts. Each question should test different aspects of ${config.topic}.

Please follow this exact format.`;

      const response = await generateResponse(prompt, [], undefined, 'google/gemini-2.5-flash');
      const parsedQuestions = parseQuestionsFromResponse(response);
      
      if (parsedQuestions.length === 0) {
        throw new Error('No valid questions found in response');
      }
      
      setQuestions(parsedQuestions);
      setUserAnswers(new Array(parsedQuestions.length).fill(-1));
      setQuestionTimes(new Array(parsedQuestions.length).fill(0));
      setTimeLeft(config.timeLimit);
      setQuestionStartTime(Date.now());
      setMode('quiz');
      
      toast.success(language === 'hi' ? 'क्विज़ तैयार है!' : 'Quiz ready!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(language === 'hi' ? 'क्विज़ बनाने में त्रुटि' : 'Error generating quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const recordQuestionTime = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newQuestionTimes = [...questionTimes];
    newQuestionTimes[currentQuestionIndex] = timeSpent;
    setQuestionTimes(newQuestionTimes);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      recordQuestionTime();
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      recordQuestionTime();
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const submitQuiz = async () => {
    recordQuestionTime();

    const score = userAnswers.reduce((total, answer, index) => {
      return answer === questions[index].correctAnswer ? total + 1 : total;
    }, 0);

    const timeTaken = config.timeLimit - timeLeft;
    const xpEarned = calculateXP(score, questions.length, timeTaken, config.timeLimit);

    if (currentUser?.uid) {
      try {
        await addPointsToUser(
          currentUser.uid,
          xpEarned,
          'quiz',
          language === 'hi' 
            ? `क्विज़ पूरी की: ${config.topic} (${score}/${questions.length} सही)`
            : `Completed Quiz: ${config.topic} (${score}/${questions.length} correct)`
        );
        
        toast.success(
          language === 'hi' 
            ? `बधाई हो! आपने +${xpEarned} XP अर्जित किए!` 
            : `Congratulations! You earned +${xpEarned} XP!`
        );
      } catch (error) {
        console.error('Error awarding points:', error);
        toast.error(
          language === 'hi' 
            ? 'पॉइंट्स अपडेट करने में त्रुटि' 
            : 'Error updating points'
        );
      }
    }

    const wrongAnswers = userAnswers.map((answer, index) => {
      if (answer !== questions[index].correctAnswer) {
        return {
          question: questions[index].question,
          userAnswer: answer >= 0 ? questions[index].options[answer] : 'No answer',
          correctAnswer: questions[index].options[questions[index].correctAnswer]
        };
      }
      return null;
    }).filter(Boolean) as QuizResult['wrongAnswers'];

    const reviewData: ReviewAnswer[] = userAnswers.map((answer, index) => ({
      questionIndex: index,
      question: questions[index].question,
      options: questions[index].options,
      userAnswer: answer,
      correctAnswer: questions[index].correctAnswer,
      explanation: questions[index].explanation,
      isCorrect: answer === questions[index].correctAnswer,
      timeSpent: questionTimes[index] || 0
    }));

    setReviewAnswers(reviewData);
    setQuizResult({
      score,
      totalQuestions: questions.length,
      timeTaken,
      wrongAnswers,
      xpEarned,
      questionTimes
    });
    setMode('result');
  };

  const resetQuiz = () => {
    setMode('config');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setReviewAnswers([]);
    setQuestionTimes([]);
    setSelectedClass('none');
    setDifficulty('medium');
    setQuizType('mixed');
    setCustomInstructions('');
    setFocusArea('balanced');
    setConfig({
      topic: '',
      subject: 'general',
      language: 'hi',
      questionCount: 5,
      timeLimit: 300
    });
  };

  const goToReview = () => {
    setMode('review');
  };

  const backToResults = () => {
    setMode('result');
  };

  // Timer effect
  React.useEffect(() => {
    if (mode === 'quiz' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (mode === 'quiz' && timeLeft === 0) {
      submitQuiz();
    }
  }, [mode, timeLeft]);

  if (mode === 'config') {
    return (
      <motion.div 
        className="max-w-4xl mx-auto p-4 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold text-gradient">
            {language === 'hi' ? 'इंटरैक्टिव AI क्विज़' : 'Interactive AI Quiz'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {language === 'hi' 
              ? 'अपने ज्ञान को परखें और नए विषयों में महारत हासिल करें' 
              : 'Test your knowledge and master new subjects'}
          </p>
        </motion.div>

        {/* Smart Recommendations Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800 dark:text-orange-300">
              {language === 'hi' ? 'स्मार्ट सुझाव' : 'Smart Recommendations'}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <div className="font-medium text-green-700 dark:text-green-400">
                {language === 'hi' ? '🎯 शुरुआती' : '🎯 Beginner'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                5-10 {language === 'hi' ? 'प्रश्न' : 'questions'} • 10-15 {language === 'hi' ? 'मिनट' : 'min'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <div className="font-medium text-blue-700 dark:text-blue-400">
                {language === 'hi' ? '📚 अभ्यास' : '📚 Practice'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                15-25 {language === 'hi' ? 'प्रश्न' : 'questions'} • 20-30 {language === 'hi' ? 'मिनट' : 'min'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border">
              <div className="font-medium text-purple-700 dark:text-purple-400">
                {language === 'hi' ? '🏆 विशेषज्ञ' : '🏆 Expert'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                30-50 {language === 'hi' ? 'प्रश्न' : 'questions'} • 45-60 {language === 'hi' ? 'मिनट' : 'min'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Configuration Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ModernCard glassEffect className="h-full">
              <ModernCardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {language === 'hi' ? 'बेसिक सेटिंग्स' : 'Basic Settings'}
                  </h3>
                </div>
              </ModernCardHeader>
              <ModernCardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic" className="text-sm font-medium">
                    {language === 'hi' ? 'विषय' : 'Topic'} *
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="topic"
                      placeholder={language === 'hi' ? 'जैसे: भारतीय इतिहास, गणित, विज्ञान...' : 'e.g: Indian History, Math, Science...'}
                      value={config.topic}
                      onChange={(e) => setConfig({...config, topic: e.target.value})}
                      className="flex-1"
                    />
                    <ModernButton
                      variant="outline"
                      size="sm"
                      onClick={generateSampleTopic}
                      className="shrink-0"
                      title={language === 'hi' ? 'नमूना विषय उत्पन्न करें' : 'Generate sample topic'}
                    >
                      <Sparkles className="h-4 w-4" />
                    </ModernButton>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    {language === 'hi' ? 'विषय श्रेणी' : 'Subject Category'}
                  </Label>
                  <Select value={config.subject} onValueChange={(value) => setConfig({...config, subject: value})}>
                    <SelectTrigger className="mt-1">
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
                  <Label className="text-sm font-medium">
                    {language === 'hi' ? 'कक्षा (वैकल्पिक)' : 'Class (Optional)'}
                  </Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={language === 'hi' ? 'कक्षा चुनें' : 'Select class'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{language === 'hi' ? 'कोई नहीं' : 'None'}</SelectItem>
                      <SelectItem value="कक्षा 1">कक्षा 1</SelectItem>
                      <SelectItem value="कक्षा 2">कक्षा 2</SelectItem>
                      <SelectItem value="कक्षा 3">कक्षा 3</SelectItem>
                      <SelectItem value="कक्षा 4">कक्षा 4</SelectItem>
                      <SelectItem value="कक्षा 5">कक्षा 5</SelectItem>
                      <SelectItem value="कक्षा 6">कक्षा 6</SelectItem>
                      <SelectItem value="कक्षा 7">कक्षा 7</SelectItem>
                      <SelectItem value="कक्षा 8">कक्षा 8</SelectItem>
                      <SelectItem value="कक्षा 9">कक्षा 9</SelectItem>
                      <SelectItem value="कक्षा 10">कक्षा 10</SelectItem>
                      <SelectItem value="कक्षा 11">कक्षा 11</SelectItem>
                      <SelectItem value="कक्षा 12">कक्षा 12</SelectItem>
                      <SelectItem value="स्नातक">स्नातक</SelectItem>
                      <SelectItem value="स्नातकोत्तर">स्नातकोत्तर</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ModernCardContent>
            </ModernCard>
          </motion.div>

          {/* Advanced Configuration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ModernCard glassEffect className="h-full">
              <ModernCardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {language === 'hi' ? 'एडवांस सेटिंग्स' : 'Advanced Settings'}
                  </h3>
                </div>
              </ModernCardHeader>
              <ModernCardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {language === 'hi' ? 'कठिनाई स्तर' : 'Difficulty Level'}
                  </Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {language === 'hi' ? 'आसान' : 'Easy'}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {language === 'hi' ? 'मध्यम' : 'Medium'}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="hard">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {language === 'hi' ? 'कठिन' : 'Hard'}
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">
                      {language === 'hi' ? 'प्रश्न संख्या' : 'Question Count'}
                    </Label>
                    <Select 
                      value={config.questionCount.toString()} 
                      onValueChange={(value) => setConfig({...config, questionCount: Number(value)})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionCountOptions.map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{count} {language === 'hi' ? 'प्रश्न' : 'Questions'}</span>
                              {count <= 10 && <span className="text-green-500 text-xs ml-2">Quick</span>}
                              {count >= 30 && <span className="text-purple-500 text-xs ml-2">Expert</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {language === 'hi' ? 'समय सीमा' : 'Time Limit'}
                    </Label>
                    <Select 
                      value={config.timeLimit.toString()} 
                      onValueChange={(value) => setConfig({...config, timeLimit: Number(value)})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeLimitOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    {language === 'hi' ? 'फोकस क्षेत्र' : 'Focus Area'}
                  </Label>
                  <Select value={focusArea} onValueChange={setFocusArea}>
                    <SelectTrigger className="mt-1">
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
                  <Label className="text-sm font-medium">
                    {language === 'hi' ? 'अतिरिक्त निर्देश (वैकल्पिक)' : 'Additional Instructions (Optional)'}
                  </Label>
                  <Input
                    placeholder={language === 'hi' ? 'जैसे: केवल व्यावहारिक प्रश्न, चित्र सहित...' : 'e.g: Only practical questions, with images...'}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </ModernCardContent>
            </ModernCard>
          </motion.div>
        </div>

        {/* Quick Setup Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800"
        >
          <h3 className="text-sm font-semibold mb-3 text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {language === 'hi' ? 'त्वरित सेटअप' : 'Quick Setup'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => {
                setConfig({...config, questionCount: 10, timeLimit: 900});
                setDifficulty('easy');
              }}
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
            >
              🎯 {language === 'hi' ? 'त्वरित टेस्ट' : 'Quick Test'}
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => {
                setConfig({...config, questionCount: 25, timeLimit: 1800});
                setDifficulty('medium');
              }}
              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              📚 {language === 'hi' ? 'अभ्यास मोड' : 'Practice Mode'}
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => {
                setConfig({...config, questionCount: 50, timeLimit: 3600});
                setDifficulty('hard');
              }}
              className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              🏆 {language === 'hi' ? 'चुनौती मोड' : 'Challenge Mode'}
            </ModernButton>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div 
          className="flex justify-center pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ModernButton
            onClick={generateQuiz}
            disabled={isLoading || !config.topic.trim()}
            size="xl"
            variant="gradient"
            glowEffect
            className="px-12 py-4 text-lg font-semibold shadow-2xl"
          >
            {isLoading ? (
              <motion.div 
                className="flex items-center gap-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-6 h-6" />
                {language === 'hi' ? 'Quiz तैयार की जा रही है...' : 'Preparing Quiz...'}
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6" />
                {language === 'hi' ? 'Quiz शुरू करें' : 'Start Quiz'}
                <Star className="w-5 h-5" />
              </div>
            )}
          </ModernButton>
        </motion.div>
      </motion.div>
    );
  }

  if (mode === 'quiz') {
    const currentQuestion = questions[currentQuestionIndex];

    return (
      <QuizQuestion
        question={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        userAnswer={userAnswers[currentQuestionIndex]}
        timeLeft={timeLeft}
        onAnswerSelect={handleAnswerSelect}
        onPrevious={goToPreviousQuestion}
        onNext={goToNextQuestion}
        onSubmit={submitQuiz}
        canGoPrevious={currentQuestionIndex > 0}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
      />
    );
  }

  if (mode === 'result' && quizResult) {
    return (
      <QuizResultsView
        result={quizResult}
        onReset={resetQuiz}
        onReviewAnswers={goToReview}
      />
    );
  }

  if (mode === 'review' && quizResult) {
    return (
      <QuizAnswerReview
        reviewAnswers={reviewAnswers}
        onBackToResults={backToResults}
        xpEarned={quizResult.xpEarned || 0}
      />
    );
  }

  return null;
};

export default InteractiveQuiz;
