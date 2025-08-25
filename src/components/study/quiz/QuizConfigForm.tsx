
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuizConfig, SubjectOption } from './types';

interface QuizConfigFormProps {
  config: QuizConfig;
  setConfig: (config: QuizConfig) => void;
  customQuestionCount: string;
  setCustomQuestionCount: (count: string) => void;
  customTimeLimit: string;
  setCustomTimeLimit: (time: string) => void;
  onStartQuiz: () => void;
  isLoading: boolean;
}

export const QuizConfigForm: React.FC<QuizConfigFormProps> = ({
  config,
  setConfig,
  customQuestionCount,
  setCustomQuestionCount,
  customTimeLimit,
  setCustomTimeLimit,
  onStartQuiz,
  isLoading
}) => {
  const { language } = useLanguage();

  const subjects: SubjectOption[] = [
    { value: 'general', label: language === 'hi' ? 'सामान्य ज्ञान' : 'General Knowledge' },
    { value: 'history', label: language === 'hi' ? 'इतिहास' : 'History' },
    { value: 'geography', label: language === 'hi' ? 'भूगोल' : 'Geography' },
    { value: 'politics', label: language === 'hi' ? 'राजनीति विज्ञान' : 'Political Science' },
    { value: 'hindi', label: language === 'hi' ? 'हिंदी' : 'Hindi' },
    { value: 'english', label: language === 'hi' ? 'अंग्रेजी' : 'English' },
    { value: 'mathematics', label: language === 'hi' ? 'गणित' : 'Mathematics' },
    { value: 'biology', label: language === 'hi' ? 'जीव विज्ञान' : 'Biology' },
    { value: 'chemistry', label: language === 'hi' ? 'रसायन शास्त्र' : 'Chemistry' },
    { value: 'physics', label: language === 'hi' ? 'भौतिक विज्ञान' : 'Physics' },
    { value: 'economics', label: language === 'hi' ? 'अर्थशास्त्र' : 'Economics' },
    { value: 'sociology', label: language === 'hi' ? 'समाजशास्त्र' : 'Sociology' },
    { value: 'psychology', label: language === 'hi' ? 'मनोविज्ञान' : 'Psychology' },
    { value: 'computer', label: language === 'hi' ? 'कंप्यूटर विज्ञान' : 'Computer Science' },
    { value: 'philosophy', label: language === 'hi' ? 'दर्शनशास्त्र' : 'Philosophy' },
    { value: 'literature', label: language === 'hi' ? 'साहित्य' : 'Literature' },
    { value: 'science', label: language === 'hi' ? 'सामान्य विज्ञान' : 'General Science' }
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <Card className="w-full">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg sm:text-xl text-purple-800 dark:text-purple-300 flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5" />
            {language === 'hi' ? 'इंटरैक्टिव क्विज़ टेस्ट' : 'Interactive Quiz Test'}
          </CardTitle>
          <CardDescription className="text-sm">
            {language === 'hi' ? 'अपनी क्विज़ सेटिंग्स कॉन्फ़िगर करें' : 'Configure your quiz settings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div>
            <Label className="text-sm font-medium">{language === 'hi' ? 'विषय/टॉपिक' : 'Topic'}</Label>
            <Textarea
              value={config.topic}
              onChange={(e) => setConfig({...config, topic: e.target.value})}
              placeholder={language === 'hi' ? 'उदाहरण: भारतीय इतिहास' : 'Example: Indian History'}
              className="mt-1 text-sm min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">{language === 'hi' ? 'विषय चुनें' : 'Select Subject'}</Label>
            <Select value={config.subject} onValueChange={(value) => setConfig({...config, subject: value})}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {subjects.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value} className="text-sm">
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">{language === 'hi' ? 'प्रश्न संख्या' : 'Question Count'}</Label>
              <div className="space-y-2 mt-1">
                <Select 
                  value={customQuestionCount ? 'custom' : config.questionCount.toString()} 
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomQuestionCount('');
                    } else {
                      setCustomQuestionCount('');
                      setConfig({...config, questionCount: parseInt(value)});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="custom">{language === 'hi' ? 'कस्टम' : 'Custom'}</SelectItem>
                  </SelectContent>
                </Select>
                {(customQuestionCount !== '' || config.questionCount.toString() === 'custom') && (
                  <Input
                    type="number"
                    placeholder={language === 'hi' ? 'प्रश्न संख्या दर्ज करें (1-50)' : 'Enter question count (1-50)'}
                    value={customQuestionCount}
                    onChange={(e) => setCustomQuestionCount(e.target.value)}
                    min="1"
                    max="50"
                    className="text-sm"
                  />
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">{language === 'hi' ? 'समय सीमा' : 'Time Limit'}</Label>
              <div className="space-y-2 mt-1">
                <Select 
                  value={customTimeLimit ? 'custom' : (config.timeLimit / 60).toString()} 
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomTimeLimit('');
                    } else {
                      setCustomTimeLimit('');
                      setConfig({...config, timeLimit: parseInt(value) * 60});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 {language === 'hi' ? 'मिनट' : 'min'}</SelectItem>
                    <SelectItem value="10">10 {language === 'hi' ? 'मिनट' : 'min'}</SelectItem>
                    <SelectItem value="15">15 {language === 'hi' ? 'मिनट' : 'min'}</SelectItem>
                    <SelectItem value="30">30 {language === 'hi' ? 'मिनट' : 'min'}</SelectItem>
                    <SelectItem value="custom">{language === 'hi' ? 'कस्टम' : 'Custom'}</SelectItem>
                  </SelectContent>
                </Select>
                {(customTimeLimit !== '' || (config.timeLimit / 60).toString() === 'custom') && (
                  <Input
                    type="number"
                    placeholder={language === 'hi' ? 'समय दर्ज करें (1-120 मिनट)' : 'Enter time (1-120 minutes)'}
                    value={customTimeLimit}
                    onChange={(e) => setCustomTimeLimit(e.target.value)}
                    min="1"
                    max="120"
                    className="text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={onStartQuiz} 
            disabled={isLoading || !config.topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 mt-6"
          >
            {isLoading ? (language === 'hi' ? 'तैयार हो रहा है...' : 'Generating...') : (language === 'hi' ? 'क्विज़ शुरू करें' : 'Start Quiz')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
