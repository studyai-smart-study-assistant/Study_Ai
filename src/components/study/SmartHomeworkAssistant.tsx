
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calculator, 
  BookOpen, 
  Lightbulb, 
  CheckCircle, 
  Clock,
  Brain,
  HelpCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { generateResponse } from '@/lib/gemini';

interface SmartHomeworkAssistantProps {
  onSendMessage: (msg: string) => void;
}

interface HomeworkQuestion {
  id: string;
  question: string;
  subject: string;
  difficulty: 'आसान' | 'मध्यम' | 'कठिन';
  helpType: 'step-by-step' | 'hint' | 'concept';
  answer: string;
  timestamp: string;
}

const SmartHomeworkAssistant: React.FC<SmartHomeworkAssistantProps> = ({ onSendMessage }) => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [helpType, setHelpType] = useState('step-by-step');
  const [isGenerating, setIsGenerating] = useState(false);
  const [homeworkHistory, setHomeworkHistory] = useState<HomeworkQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const subjects = [
    'गणित', 'भौतिक विज्ञान', 'रसायन विज्ञान', 'जीव विज्ञान',
    'हिंदी', 'अंग्रेजी', 'इतिहास', 'भूगोल', 'अर्थशास्त्र'
  ];

  const helpTypes = [
    { value: 'step-by-step', label: 'Step-by-Step समाधान', icon: Calculator },
    { value: 'hint', label: 'केवल Hint दें', icon: Lightbulb },
    { value: 'concept', label: 'Concept समझाएं', icon: Brain }
  ];

  const smartSuggestions = [
    "2x + 5 = 15 को solve करें",
    "Photosynthesis की process explain करें", 
    "भारत के राज्यों की राजधानियां बताएं",
    "Simple present tense के rules क्या हैं?",
    "Newton के laws of motion समझाएं"
  ];

  const generateSmartPrompt = (question: string, subject: string, helpType: string, difficulty: string) => {
    let prompt = '';
    
    if (helpType === 'step-by-step') {
      prompt = `${subject} के इस सवाल का step-by-step समाधान दें: "${question}". 
      कृपया हर step को clearly explain करें और easy language में समझाएं। 
      Difficulty level: ${difficulty}`;
    } else if (helpType === 'hint') {
      prompt = `${subject} के इस सवाल के लिए केवल hint दें, complete answer नहीं: "${question}". 
      Student को खुद solve करने में help करें। Difficulty: ${difficulty}`;
    } else if (helpType === 'concept') {
      prompt = `${subject} के इस topic/concept को detail में समझाएं: "${question}". 
      Basic से advanced level तक explain करें। Examples भी दें। Difficulty: ${difficulty}`;
    }

    return prompt;
  };

  const solveHomework = async () => {
    if (!currentQuestion.trim()) {
      toast.error('कृपया अपना सवाल लिखें');
      return;
    }

    if (!selectedSubject) {
      toast.error('कृपया विषय चुनें');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = generateSmartPrompt(currentQuestion, selectedSubject, helpType, selectedDifficulty || 'मध्यम');
      const answer = await generateResponse(prompt);

      const newHomeworkQuestion: HomeworkQuestion = {
        id: Date.now().toString(),
        question: currentQuestion,
        subject: selectedSubject,
        difficulty: (selectedDifficulty as any) || 'मध्यम',
        helpType: helpType as any,
        answer: answer,
        timestamp: new Date().toISOString()
      };

      setHomeworkHistory([newHomeworkQuestion, ...homeworkHistory.slice(0, 9)]);
      setCurrentAnswer(answer);
      
      // Clear form
      setCurrentQuestion('');
      
      toast.success('✨ Homework solution तैयार है!');
    } catch (error) {
      console.error('Error solving homework:', error);
      toast.error('Solution generate करने में error आया');
    } finally {
      setIsGenerating(false);
    }
  };

  const useSuggestion = (suggestion: string) => {
    setCurrentQuestion(suggestion);
    // Auto-detect subject based on suggestion
    if (suggestion.includes('2x') || suggestion.includes('solve')) {
      setSelectedSubject('गणित');
    } else if (suggestion.includes('Photosynthesis')) {
      setSelectedSubject('जीव विज्ञान');
    } else if (suggestion.includes('राज्य') || suggestion.includes('राजधानी')) {
      setSelectedSubject('भूगोल');
    } else if (suggestion.includes('tense') || suggestion.includes('English')) {
      setSelectedSubject('अंग्रेजी');
    } else if (suggestion.includes('Newton') || suggestion.includes('laws')) {
      setSelectedSubject('भौतिक विज्ञान');
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Suggestions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Zap className="h-5 w-5" />
            Quick Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {smartSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => useSuggestion(suggestion)}
                className="justify-start text-left h-auto p-3"
              >
                <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{suggestion}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Homework Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Smart Homework Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">आपका सवाल लिखें</label>
            <Textarea
              placeholder="जैसे: 2x + 5 = 15 को solve करें, या Photosynthesis explain करें..."
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">विषय</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="विषय चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Level चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="आसान">आसान</SelectItem>
                  <SelectItem value="मध्यम">मध्यम</SelectItem>
                  <SelectItem value="कठिन">कठिन</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Help Type</label>
              <Select value={helpType} onValueChange={setHelpType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {helpTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={solveHomework} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                AI Solving...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Smart Solution पाएं
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Current Answer */}
      {currentAnswer && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Solution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm">{currentAnswer}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Homework History */}
      {homeworkHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              पिछले Solved Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {homeworkHistory.map(item => (
                  <div key={item.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.subject}</Badge>
                        <Badge variant="outline">{item.difficulty}</Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString('hi-IN')}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-2">{item.question}</h4>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs max-h-20 overflow-y-auto">
                      {item.answer.substring(0, 100)}...
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setCurrentAnswer(item.answer)}
                    >
                      Full Solution देखें
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartHomeworkAssistant;
