
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Target, 
  Brain, 
  Award,
  GraduationCap,
  FileText,
  Star,
  TrendingUp,
  Lightbulb,
  Zap,
  BarChart3,
  School,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { generateResponse } from '@/lib/gemini';
import { toast } from 'sonner';

interface ExamPreparationPlannerProps {
  onSendMessage: (msg: string) => void;
}

type DifficultyLevel = "normal" | "medium" | "hard";
type ExplanationStyle = "brief" | "detailed" | "story-like" | "exam-focused" | "knowledge-rich";

interface ExamDetails {
  examName: string;
  examDate: string;
  subjects: string[];
  syllabus: string;
  currentLevel: string;
  studyHours: string;
  preferredTime: string;
  studyStyle: string;
  weakAreas: string;
  strongAreas: string;
  goals: string;
  resources: string;
  previousExperience: string;
  specificTopics: string;
  practiceNeeds: string;
  motivationLevel: string;
  challenges: string;
  revision: string;
  timeManagement: string;
  feedback: string;
}

interface StudyPlan {
  overview: string;
  weeklySchedule: WeeklySchedule[];
  dailyTasks: DailyTask[];
  resources: Resource[];
  tips: string[];
  milestones: Milestone[];
  revision: RevisionPlan;
}

interface WeeklySchedule {
  week: number;
  focus: string;
  topics: string[];
  goals: string[];
  assessment: string;
}

interface DailyTask {
  day: string;
  subject: string;
  topics: string[];
  duration: string;
  type: string;
  priority: string;
}

interface Resource {
  type: string;
  title: string;
  description: string;
  url?: string;
}

interface Milestone {
  week: number;
  title: string;
  description: string;
  criteria: string[];
}

interface RevisionPlan {
  strategy: string;
  schedule: RevisionSchedule[];
  techniques: string[];
}

interface RevisionSchedule {
  week: number;
  focus: string;
  subjects: string[];
  methods: string[];
}

const ExamPreparationPlanner: React.FC<ExamPreparationPlannerProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [activeTab, setActiveTab] = useState('input');
  
  const [examDetails, setExamDetails] = useState<ExamDetails>({
    examName: '',
    examDate: '',
    subjects: [],
    syllabus: '',
    currentLevel: '',
    studyHours: '',
    preferredTime: '',
    studyStyle: '',
    weakAreas: '',
    strongAreas: '',
    goals: '',
    resources: '',
    previousExperience: '',
    specificTopics: '',
    practiceNeeds: '',
    motivationLevel: '',
    challenges: '',
    revision: '',
    timeManagement: '',
    feedback: ''
  });
  
  const [preferences, setPreferences] = useState({
    difficulty: 'medium' as DifficultyLevel,
    explanationStyle: 'detailed' as ExplanationStyle,
    includeExamples: true,
    includePractice: true,
    includeRevision: true,
    includeMotivation: true
  });

  const [planProgress, setPlanProgress] = useState(0);

  const handleInputChange = (field: keyof ExamDetails, value: string | string[]) => {
    setExamDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectChange = (subjects: string[]) => {
    setExamDetails(prev => ({
      ...prev,
      subjects
    }));
  };

  const validateInputs = (): boolean => {
    const required = ['examName', 'examDate', 'currentLevel', 'studyHours'];
    const missing = required.filter(field => !examDetails[field as keyof ExamDetails]);
    
    if (missing.length > 0) {
      toast.error(`कृपया निम्नलिखित फ़ील्ड भरें: ${missing.join(', ')}`);
      return false;
    }
    
    if (examDetails.subjects.length === 0) {
      toast.error('कृपया कम से कम एक विषय चुनें');
      return false;
    }
    
    return true;
  };

  const generateStudyPlan = async () => {
    if (!validateInputs()) return;
    
    setIsGenerating(true);
    setPlanProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setPlanProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const prompt = buildExamPreparationPrompt(examDetails, preferences);
      const response = await generateResponse(prompt);
      
      clearInterval(progressInterval);
      setPlanProgress(100);
      
      try {
        const parsedPlan = JSON.parse(response);
        setStudyPlan(parsedPlan);
        setActiveTab('overview');
        toast.success('आपका विस्तृत अध्ययन योजना तैयार हो गया है!');
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        // Fallback: create a basic plan structure
        const fallbackPlan = createFallbackPlan(response, examDetails);
        setStudyPlan(fallbackPlan);
        setActiveTab('overview');
        toast.success('अध्ययन योजना तैयार हो गया है!');
      }
      
    } catch (error) {
      console.error('Error generating study plan:', error);
      toast.error('योजना बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildExamPreparationPrompt = (details: ExamDetails, prefs: typeof preferences): string => {
    return `आप एक विशेषज्ञ शिक्षा सलाहकार हैं। निम्नलिखित जानकारी के आधार पर एक विस्तृत और व्यावहारिक अध्ययन योजना बनाएं:

परीक्षा विवरण:
- परीक्षा का नाम: ${details.examName}
- परीक्षा की तारीख: ${details.examDate}
- विषय: ${details.subjects.join(', ')}
- पाठ्यक्रम: ${details.syllabus}
- वर्तमान स्तर: ${details.currentLevel}
- दैनिक अध्ययन समय: ${details.studyHours} घंटे
- पसंदीदा अध्ययन समय: ${details.preferredTime}
- अध्ययन शैली: ${details.studyStyle}

व्यक्तिगत विश्लेषण:
- कमजोर क्षेत्र: ${details.weakAreas}
- मजबूत क्षेत्र: ${details.strongAreas}
- लक्ष्य: ${details.goals}
- उपलब्ध संसाधन: ${details.resources}
- पूर्व अनुभव: ${details.previousExperience}

विशिष्ट आवश्यकताएं:
- विशिष्ट विषय: ${details.specificTopics}
- अभ्यास की जरूरत: ${details.practiceNeeds}
- प्रेरणा स्तर: ${details.motivationLevel}
- चुनौतियां: ${details.challenges}

रणनीति प्राथमिकताएं:
- कठिनाई स्तर: ${prefs.difficulty}
- व्याख्या शैली: ${prefs.explanationStyle}
- उदाहरण शामिल करें: ${prefs.includeExamples}
- अभ्यास शामिल करें: ${prefs.includePractice}
- पुनरावृत्ति योजना: ${prefs.includeRevision}
- प्रेरणा तत्व: ${prefs.includeMotivation}

कृपया निम्नलिखित JSON प्रारूप में एक संपूर्ण अध्ययन योजना प्रदान करें:

{
  "overview": "योजना का संक्षिप्त विवरण",
  "weeklySchedule": [
    {
      "week": 1,
      "focus": "सप्ताह का मुख्य फोकस",
      "topics": ["विषय 1", "विषय 2"],
      "goals": ["लक्ष्य 1", "लक्ष्य 2"],
      "assessment": "मूल्यांकन विधि"
    }
  ],
  "dailyTasks": [
    {
      "day": "सोमवार",
      "subject": "विषय",
      "topics": ["टॉपिक 1", "टॉपिक 2"],
      "duration": "2 घंटे",
      "type": "अध्ययन प्रकार",
      "priority": "उच्च/मध्यम/निम्न"
    }
  ],
  "resources": [
    {
      "type": "पुस्तक/वीडियो/ऑनलाइन",
      "title": "संसाधन का नाम",
      "description": "संसाधन का विवरण",
      "url": "लिंक (यदि कोई हो)"
    }
  ],
  "tips": ["सुझाव 1", "सुझाव 2"],
  "milestones": [
    {
      "week": 1,
      "title": "माइलस्टोन",
      "description": "विवरण",
      "criteria": ["मापदंड 1", "मापदंड 2"]
    }
  ],
  "revision": {
    "strategy": "पुनरावृत्ति रणनीति",
    "schedule": [
      {
        "week": 1,
        "focus": "फोकस एरिया",
        "subjects": ["विषय 1"],
        "methods": ["विधि 1", "विधि 2"]
      }
    ],
    "techniques": ["तकनीक 1", "तकनीक 2"]
  }
}

महत्वपूर्ण: कृपया केवल वैध JSON प्रारूप में उत्तर दें। अतिरिक्त टेक्स्ट न जोड़ें।`;
  };

  const createFallbackPlan = (response: string, details: ExamDetails): StudyPlan => {
    return {
      overview: `${details.examName} के लिए व्यक्तिगत अध्ययन योजना`,
      weeklySchedule: [
        {
          week: 1,
          focus: "बुनियादी अवधारणाओं की समझ",
          topics: details.subjects.slice(0, 2),
          goals: ["मूल सिद्धांतों को समझना", "अभ्यास प्रश्नों को हल करना"],
          assessment: "साप्ताहिक मॉक टेस्ट"
        }
      ],
      dailyTasks: [
        {
          day: "सोमवार",
          subject: details.subjects[0] || "मुख्य विषय",
          topics: ["बुनियादी अवधारणाएं"],
          duration: details.studyHours + " घंटे",
          type: "सिद्धांत अध्ययन",
          priority: "उच्च"
        }
      ],
      resources: [
        {
          type: "पुस्तक",
          title: "मानक पाठ्यपुस्तक",
          description: "विषय की आधारभूत जानकारी के लिए"
        }
      ],
      tips: [
        "नियमित अध्ययन करें",
        "नोट्स बनाएं",
        "मॉक टेस्ट दें"
      ],
      milestones: [
        {
          week: 1,
          title: "बुनियादी तैयारी पूर्ण",
          description: "सभी मूल अवधारणाओं की समझ",
          criteria: ["सिद्धांतों की स्पष्टता", "अभ्यास प्रश्नों का समाधान"]
        }
      ],
      revision: {
        strategy: "चरणबद्ध पुनरावृत्ति",
        schedule: [
          {
            week: 1,
            focus: "मुख्य विषय",
            subjects: details.subjects,
            methods: ["नोट्स पढ़ना", "प्रश्न अभ्यास"]
          }
        ],
        techniques: ["स्पेसड रिपीटिशन", "एक्टिव रिकॉल"]
      }
    };
  };

  const sendPlanToChat = () => {
    if (!studyPlan) return;
    
    const planSummary = `📚 ${examDetails.examName} के लिए अध्ययन योजना:

${studyPlan.overview}

📅 साप्ताहिक लक्ष्य:
${studyPlan.weeklySchedule.map(week => 
  `सप्ताह ${week.week}: ${week.focus}`
).join('\n')}

💡 मुख्य सुझाव:
${studyPlan.tips.slice(0, 5).map(tip => `• ${tip}`).join('\n')}

क्या आप इस योजना पर विस्तार से चर्चा करना चाहते हैं?`;

    onSendMessage(planSummary);
    toast.success('योजना चैट में भेज दी गई है!');
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <GraduationCap className="h-5 w-5" />
            विस्तृत परीक्षा तैयारी योजनाकार
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">योजना तैयार की जा रही है...</span>
                <span className="text-sm text-gray-500">{planProgress}%</span>
              </div>
              <Progress value={planProgress} className="w-full" />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="input">जानकारी</TabsTrigger>
              <TabsTrigger value="overview">सिंहावलोकन</TabsTrigger>
              <TabsTrigger value="schedule">समय सारणी</TabsTrigger>
              <TabsTrigger value="daily">दैनिक कार्य</TabsTrigger>
              <TabsTrigger value="resources">संसाधन</TabsTrigger>
              <TabsTrigger value="tips">सुझाव</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-6">
              <div className="grid gap-6">
                {/* Basic Information */}
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      मूलभूत जानकारी
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="examName">परीक्षा का नाम *</Label>
                        <Input
                          id="examName"
                          value={examDetails.examName}
                          onChange={(e) => handleInputChange('examName', e.target.value)}
                          placeholder="उदा: JEE Main, NEET, UPSC"
                        />
                      </div>
                      <div>
                        <Label htmlFor="examDate">परीक्षा की तारीख *</Label>
                        <Input
                          id="examDate"
                          type="date"
                          value={examDetails.examDate}
                          onChange={(e) => handleInputChange('examDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>विषय चुनें *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {['गणित', 'भौतिकी', 'रसायन', 'जीव विज्ञान', 'अंग्रेजी', 'हिंदी', 'इतिहास', 'भूगोल', 'राजनीति विज्ञान', 'अर्थशास्त्र', 'समाजशास्त्र', 'दर्शनशास्त्र'].map(subject => (
                          <div key={subject} className="flex items-center space-x-2">
                            <Checkbox
                              id={subject}
                              checked={examDetails.subjects.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleSubjectChange([...examDetails.subjects, subject]);
                                } else {
                                  handleSubjectChange(examDetails.subjects.filter(s => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={subject} className="text-sm">{subject}</Label>
                          </div>
                        ))}
                      </div>
                      {examDetails.subjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {examDetails.subjects.map(subject => (
                            <Badge key={subject} variant="secondary">{subject}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Assessment */}
                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      व्यक्तिगत मूल्यांकन
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentLevel">वर्तमान तैयारी का स्तर *</Label>
                      <Select onValueChange={(value) => handleInputChange('currentLevel', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="अपना स्तर चुनें" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">शुरुआती (0-25%)</SelectItem>
                          <SelectItem value="intermediate">मध्यम (25-50%)</SelectItem>
                          <SelectItem value="advanced">उच्च (50-75%)</SelectItem>
                          <SelectItem value="expert">विशेषज्ञ (75-100%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="studyHours">दैनिक अध्ययन समय (घंटे) *</Label>
                        <Select onValueChange={(value) => handleInputChange('studyHours', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="घंटे चुनें" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2">1-2 घंटे</SelectItem>
                            <SelectItem value="3-4">3-4 घंटे</SelectItem>
                            <SelectItem value="5-6">5-6 घंटे</SelectItem>
                            <SelectItem value="7-8">7-8 घंटे</SelectItem>
                            <SelectItem value="8+">8+ घंटे</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="preferredTime">पसंदीदा अध्ययन समय</Label>
                        <Select onValueChange={(value) => handleInputChange('preferredTime', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="समय चुनें" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="early-morning">सुबह जल्दी (5-8 AM)</SelectItem>
                            <SelectItem value="morning">सुबह (8-12 PM)</SelectItem>
                            <SelectItem value="afternoon">दोपहर (12-4 PM)</SelectItem>
                            <SelectItem value="evening">शाम (4-8 PM)</SelectItem>
                            <SelectItem value="night">रात (8-12 AM)</SelectItem>
                            <SelectItem value="late-night">देर रात (12-5 AM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="weakAreas">कमजोर क्षेत्र</Label>
                      <Textarea
                        id="weakAreas"
                        value={examDetails.weakAreas}
                        onChange={(e) => handleInputChange('weakAreas', e.target.value)}
                        placeholder="जिन विषयों/टॉपिक्स में कठिनाई होती है..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="strongAreas">मजबूत क्षेत्र</Label>
                      <Textarea
                        id="strongAreas"
                        value={examDetails.strongAreas}
                        onChange={(e) => handleInputChange('strongAreas', e.target.value)}
                        placeholder="जिन विषयों/टॉपिक्स में अच्छी पकड़ है..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Study Preferences */}
                <Card className="border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      अध्ययन प्राथमिकताएं
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>कठिनाई स्तर</Label>
                      <RadioGroup
                        value={preferences.difficulty}
                        onValueChange={(value: DifficultyLevel) => 
                          setPreferences(prev => ({ ...prev, difficulty: value }))
                        }
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="normal" id="normal" />
                          <Label htmlFor="normal">सामान्य</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">मध्यम</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hard" id="hard" />
                          <Label htmlFor="hard">कठिन</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>व्याख्या शैली</Label>
                      <RadioGroup
                        value={preferences.explanationStyle}
                        onValueChange={(value: ExplanationStyle) => 
                          setPreferences(prev => ({ ...prev, explanationStyle: value }))
                        }
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="brief" id="brief" />
                          <Label htmlFor="brief">संक्षिप्त</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="detailed" id="detailed" />
                          <Label htmlFor="detailed">विस्तृत</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="story-like" id="story-like" />
                          <Label htmlFor="story-like">कहानी जैसा</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="exam-focused" id="exam-focused" />
                          <Label htmlFor="exam-focused">परीक्षा केंद्रित</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="knowledge-rich" id="knowledge-rich" />
                          <Label htmlFor="knowledge-rich">ज्ञान समृद्ध</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'includeExamples', label: 'उदाहरण शामिल करें' },
                        { key: 'includePractice', label: 'अभ्यास प्रश्न शामिल करें' },
                        { key: 'includeRevision', label: 'पुनरावृत्ति योजना शामिल करें' },
                        { key: 'includeMotivation', label: 'प्रेरणा तत्व शामिल करें' }
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={preferences[key as keyof typeof preferences] as boolean}
                            onCheckedChange={(checked) => 
                              setPreferences(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                          <Label htmlFor={key}>{label}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={generateStudyPlan}
                  disabled={isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      योजना तैयार की जा रही है...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      विस्तृत अध्ययन योजना बनाएं
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="overview">
              {studyPlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      योजना सिंहावलोकन
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700 leading-relaxed">{studyPlan.overview}</p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          <Star className="h-3 w-3 mr-1" />
                          {examDetails.examName}
                        </Badge>
                        <Button onClick={sendPlanToChat} variant="outline" size="sm">
                          चैट में भेजें
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  पहले योजना बनाने के लिए जानकारी भरें
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule">
              {studyPlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      साप्ताहिक समय सारणी
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studyPlan.weeklySchedule.map((week, index) => (
                        <Card key={index} className="border-purple-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold">सप्ताह {week.week}</h4>
                              <div className="flex gap-2">
                                <Badge variant="secondary">Focus: {week.focus}</Badge>
                                <Badge variant="outline">Assessment: {week.assessment}</Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium mb-2">मुख्य विषय:</h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {week.topics.map((topic, idx) => (
                                    <li key={idx} className="text-sm">{topic}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium mb-2">लक्ष्य:</h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {week.goals.map((goal, idx) => (
                                    <li key={idx} className="text-sm">{goal}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  पहले योजना बनाएं
                </div>
              )}
            </TabsContent>

            <TabsContent value="daily">
              {studyPlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      दैनिक कार्य सूची
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studyPlan.dailyTasks.map((task, index) => (
                        <Card key={index} className="border-green-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{task.day}</h4>
                              <div className="flex gap-2">
                                <Badge variant={task.priority === 'उच्च' ? 'destructive' : task.priority === 'मध्यम' ? 'default' : 'secondary'}>
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline">{task.duration}</Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">विषय:</span> {task.subject}
                              </div>
                              <div>
                                <span className="font-medium">प्रकार:</span> {task.type}
                              </div>
                              <div>
                                <span className="font-medium">विषय:</span> {task.topics.join(', ')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  पहले योजना बनाएं
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources">
              {studyPlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      अध्ययन संसाधन
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {studyPlan.resources.map((resource, index) => (
                        <Card key={index} className="border-blue-200">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold">{resource.title}</span>
                              <Badge variant="secondary">{resource.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                            {resource.url && (
                              <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline text-sm">
                                लिंक देखें →
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  पहले योजना बनाएं
                </div>
              )}
            </TabsContent>

            <TabsContent value="tips">
              {studyPlan ? (
                <Tabs defaultValue="tips" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tips">सुझाव</TabsTrigger>
                    <TabsTrigger value="milestones">माइलस्टोन</TabsTrigger>
                    <TabsTrigger value="revision">पुनरावृत्ति</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tips">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          प्रभावी अध्ययन सुझाव
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {studyPlan.tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium text-purple-700">{index + 1}</span>
                              </div>
                              <p className="text-sm">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="milestones">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          उपलब्धि मील के पत्थर
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {studyPlan.milestones.map((milestone, index) => (
                            <Card key={index} className="border-orange-200">
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold">{milestone.title}</h4>
                                  <Badge variant="outline">सप्ताह {milestone.week}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                                <div>
                                  <h5 className="font-medium mb-2">मापदंड:</h5>
                                  <ul className="list-disc list-inside space-y-1">
                                    {milestone.criteria.map((criterion, idx) => (
                                      <li key={idx} className="text-sm">{criterion}</li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="revision">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <School className="h-5 w-5" />
                          पुनरावृत्ति रणनीति
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold mb-2">मुख्य रणनीति:</h4>
                            <p className="text-sm">{studyPlan.revision.strategy}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3">पुनरावृत्ति तकनीकें:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {studyPlan.revision.techniques.map((technique, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">{technique}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3">साप्ताहिक पुनरावृत्ति योजना:</h4>
                            <div className="space-y-3">
                              {studyPlan.revision.schedule.map((week, index) => (
                                <Card key={index} className="border-green-200">
                                  <CardContent className="pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium">सप्ताह {week.week}</h5>
                                      <Badge variant="secondary">{week.focus}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="font-medium">विषय:</span> {week.subjects.join(', ')}
                                      </div>
                                      <div>
                                        <span className="font-medium">विधि:</span> {week.methods.join(', ')}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  पहले योजना बनाएं
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {studyPlan && (
        <>
          <Separator />
          <div className="flex gap-2 justify-center">
            <Button onClick={sendPlanToChat} className="bg-green-600 hover:bg-green-700">
              <Brain className="mr-2 h-4 w-4" />
              पूरी योजना चैट में भेजें
            </Button>
            <Button variant="outline" onClick={() => setStudyPlan(null)}>
              नई योजना बनाएं
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamPreparationPlanner;
