
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StudentActivityTracker, SubjectInterest } from '@/utils/studentActivityTracker';
import { addPointsToUser } from '@/utils/points';
import { toast } from 'sonner';

interface PersonalizedProblemsProps {
  currentUser: any;
  studentPoints: number;
  setStudentPoints: (points: number) => void;
  studentLevel: number;
  setStudentLevel: (level: number) => void;
}

interface Problem {
  id: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  topic: string;
}

const PersonalizedProblems: React.FC<PersonalizedProblemsProps> = ({
  currentUser,
  studentPoints,
  setStudentPoints,
  studentLevel,
  setStudentLevel
}) => {
  const [subjectInterests, setSubjectInterests] = useState<SubjectInterest[]>([]);
  const [dailyProblems, setDailyProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedProblems, setCompletedProblems] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadSubjectInterests();
      loadDailyProblems();
      loadCompletedProblems();
    }
  }, [currentUser]);

  const loadSubjectInterests = () => {
    const interests = StudentActivityTracker.getSubjectInterests(currentUser.uid);
    setSubjectInterests(interests);
  };

  const loadDailyProblems = () => {
    const today = new Date().toDateString();
    const savedProblems = localStorage.getItem(`${currentUser.uid}_daily_problems_${today}`);
    
    if (savedProblems) {
      setDailyProblems(JSON.parse(savedProblems));
    } else {
      generateDailyProblems();
    }
  };

  const loadCompletedProblems = () => {
    const today = new Date().toDateString();
    const completed = localStorage.getItem(`${currentUser.uid}_completed_problems_${today}`);
    if (completed) {
      setCompletedProblems(JSON.parse(completed));
    }
  };

  const generateDailyProblems = () => {
    const interests = StudentActivityTracker.getSubjectInterests(currentUser.uid);
    const problems: Problem[] = [];

    // Top 3 interested subjects के लिए problems generate करें
    const topSubjects = interests.slice(0, 3);
    
    if (topSubjects.length === 0) {
      // Default problems if no interests found
      topSubjects.push({
        subject: 'गणित',
        knowledgeLevel: 'beginner',
        interestScore: 50,
        totalActivities: 0,
        averageScore: 0,
        timeSpent: 0,
        lastActivity: '',
        strongTopics: [],
        weakTopics: []
      });
    }

    topSubjects.forEach((interest, index) => {
      const problemsForSubject = generateProblemsForSubject(
        interest.subject, 
        interest.knowledgeLevel, 
        2 // 2 problems per subject
      );
      problems.push(...problemsForSubject);
    });

    const today = new Date().toDateString();
    localStorage.setItem(`${currentUser.uid}_daily_problems_${today}`, JSON.stringify(problems));
    setDailyProblems(problems);
  };

  const generateProblemsForSubject = (subject: string, level: 'beginner' | 'intermediate' | 'advanced', count: number): Problem[] => {
    const problemTemplates = {
      'गणित': {
        beginner: [
          { q: '5 + 3 = ?', options: ['6', '7', '8', '9'], correct: '8', explanation: '5 + 3 = 8', topic: 'जोड़' },
          { q: '10 - 4 = ?', options: ['5', '6', '7', '8'], correct: '6', explanation: '10 - 4 = 6', topic: 'घटाव' },
          { q: '3 × 4 = ?', options: ['10', '11', '12', '13'], correct: '12', explanation: '3 × 4 = 12', topic: 'गुणा' }
        ],
        intermediate: [
          { q: '25% का 80 = ?', options: ['15', '20', '25', '30'], correct: '20', explanation: '80 का 25% = 80 × 25/100 = 20', topic: 'प्रतिशत' },
          { q: 'x + 5 = 12, x = ?', options: ['5', '6', '7', '8'], correct: '7', explanation: 'x = 12 - 5 = 7', topic: 'बीजगणित' }
        ],
        advanced: [
          { q: '∫x²dx = ?', options: ['x³/3 + C', 'x³ + C', '2x + C', 'x³/2 + C'], correct: 'x³/3 + C', explanation: 'x² का समाकलन x³/3 + C है', topic: 'कैलकुलस' }
        ]
      },
      'विज्ञान': {
        beginner: [
          { q: 'पानी का रासायनिक सूत्र क्या है?', options: ['H2O', 'H2O2', 'HO', 'H3O'], correct: 'H2O', explanation: 'पानी का सूत्र H2O है', topic: 'रसायन' },
          { q: 'प्रकाश की गति कितनी है?', options: ['3×10⁸ m/s', '3×10⁷ m/s', '3×10⁹ m/s', '3×10⁶ m/s'], correct: '3×10⁸ m/s', explanation: 'प्रकाश की गति 3×10⁸ m/s है', topic: 'भौतिकी' }
        ],
        intermediate: [
          { q: 'फोटोसिंथेसिस में कौन सी गैस निकलती है?', options: ['CO2', 'O2', 'N2', 'H2'], correct: 'O2', explanation: 'प्रकाश संश्लेषण में ऑक्सीजन निकलती है', topic: 'जीव विज्ञान' }
        ],
        advanced: [
          { q: 'DNA की संरचना किसने खोजी?', options: ['Watson & Crick', 'Darwin', 'Mendel', 'Fleming'], correct: 'Watson & Crick', explanation: 'वाटसन और क्रिक ने DNA की संरचना खोजी', topic: 'आनुवंशिकता' }
        ]
      }
    };

    const templates = problemTemplates[subject as keyof typeof problemTemplates]?.[level] || problemTemplates['गणित']['beginner'];
    const selectedTemplates = templates.slice(0, count);

    return selectedTemplates.map((template, index) => ({
      id: `${subject}_${level}_${index}_${Date.now()}`,
      subject,
      difficulty: level,
      question: template.q,
      options: template.options,
      correctAnswer: template.correct,
      explanation: template.explanation,
      points: level === 'beginner' ? 5 : level === 'intermediate' ? 10 : 15,
      topic: template.topic
    }));
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) {
      toast.error('कृपया एक उत्तर चुनें');
      return;
    }

    const currentProblem = dailyProblems[currentProblemIndex];
    const correct = selectedAnswer === currentProblem.correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);

    // Track activity
    StudentActivityTracker.trackActivity(currentUser.uid, {
      subject: currentProblem.subject,
      activityType: 'problem_solving',
      content: currentProblem.question,
      correctAnswers: correct ? 1 : 0,
      totalQuestions: 1,
      timeSpent: 60, // Assume 1 minute per problem
      difficulty: currentProblem.difficulty
    });

    // Award points if correct
    if (correct) {
      try {
        await addPointsToUser(
          currentUser.uid,
          currentProblem.points,
          'quiz',
          `${currentProblem.subject} में सही उत्तर: +${currentProblem.points} पॉइंट्स`
        );

        // Reload points
        const points = localStorage.getItem(`${currentUser.uid}_points`);
        const level = localStorage.getItem(`${currentUser.uid}_level`);
        setStudentPoints(points ? parseInt(points) : 0);
        setStudentLevel(level ? parseInt(level) : 1);

        toast.success(`सही उत्तर! +${currentProblem.points} पॉइंट्स मिले`);
      } catch (error) {
        console.error("Error awarding points:", error);
      }
    }

    // Mark as completed
    const newCompleted = [...completedProblems, currentProblem.id];
    setCompletedProblems(newCompleted);
    
    const today = new Date().toDateString();
    localStorage.setItem(`${currentUser.uid}_completed_problems_${today}`, JSON.stringify(newCompleted));
  };

  const nextProblem = () => {
    setShowResult(false);
    setSelectedAnswer('');
    setCurrentProblemIndex(prev => prev + 1);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentProblem = dailyProblems[currentProblemIndex];
  const isCompleted = currentProblem && completedProblems.includes(currentProblem.id);
  const allCompleted = dailyProblems.every(p => completedProblems.includes(p.id));

  if (dailyProblems.length === 0) {
    return (
      <CardContent className="p-4">
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">आज के लिए समस्याएं तैयार की जा रही हैं...</p>
          <Button onClick={generateDailyProblems} variant="outline">
            समस्याएं तैयार करें
          </Button>
        </div>
      </CardContent>
    );
  }

  if (allCompleted) {
    return (
      <CardContent className="p-4">
        <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            बधाई हो! आपने आज की सभी समस्याएं हल कर लीं
          </h3>
          <p className="text-green-600 dark:text-green-400 mb-4">
            कल नई समस्याएं आपका इंतजार करेंगी
          </p>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {dailyProblems.length} समस्याएं पूर्ण
          </Badge>
        </div>
      </CardContent>
    );
  }

  if (!currentProblem || currentProblemIndex >= dailyProblems.length) {
    return (
      <CardContent className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">कोई और समस्या उपलब्ध नहीं है</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            व्यक्तिगत समस्याएं
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(currentProblem.difficulty)}>
              {currentProblem.difficulty === 'beginner' ? 'आसान' : 
               currentProblem.difficulty === 'intermediate' ? 'मध्यम' : 'कठिन'}
            </Badge>
            <Badge variant="outline">
              {currentProblemIndex + 1}/{dailyProblems.length}
            </Badge>
          </div>
        </div>

        <Progress value={((currentProblemIndex + (showResult ? 1 : 0)) / dailyProblems.length) * 100} className="h-2" />

        {isCompleted ? (
          <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 dark:text-green-400">यह समस्या पहले से हल है</p>
            <Button onClick={nextProblem} className="mt-2">
              अगली समस्या
            </Button>
          </div>
        ) : (
          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{currentProblem.subject}</CardTitle>
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">{currentProblem.points} पॉइंट्स</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium">{currentProblem.question}</h4>
                
                {currentProblem.options && (
                  <div className="space-y-2">
                    {currentProblem.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedAnswer === option
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={selectedAnswer === option}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          className="sr-only"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {showResult && (
                  <div className={`p-3 rounded-md ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`font-medium ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {isCorrect ? 'सही उत्तर!' : 'गलत उत्तर'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentProblem.explanation}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm font-medium mt-1">
                        सही उत्तर: {currentProblem.correctAnswer}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {!showResult ? (
                    <Button onClick={submitAnswer} className="flex-1" disabled={!selectedAnswer}>
                      उत्तर जमा करें
                    </Button>
                  ) : (
                    <Button onClick={nextProblem} className="flex-1">
                      {currentProblemIndex < dailyProblems.length - 1 ? 'अगली समस्या' : 'समाप्त'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {subjectInterests.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">आपकी रुचि के विषय:</h4>
            <div className="flex flex-wrap gap-2">
              {subjectInterests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {interest.subject} ({Math.round(interest.interestScore)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default PersonalizedProblems;
