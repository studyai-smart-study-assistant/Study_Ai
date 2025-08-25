
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, RefreshCw, Lightbulb, Clock, Star, Plus, BookMarked, Calculator, Atom, Dna, Globe, History, Computer, FileText, TrendingUp, Brain, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface HomeworkAssistantProps {
  onSendMessage: (message: string) => void;
}

const HomeworkAssistant: React.FC<HomeworkAssistantProps> = ({ onSendMessage }) => {
  const [problem, setProblem] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [assistMode, setAssistMode] = useState('stepByStep');
  const [isLoading, setIsLoading] = useState(false);
  const [urgency, setUrgency] = useState('normal');
  const { t, language } = useLanguage();

  const predefinedSubjects = [
    { value: 'math', label: t('mathematics'), icon: Calculator, color: 'bg-blue-500' },
    { value: 'physics', label: t('physics'), icon: Atom, color: 'bg-purple-500' },
    { value: 'chemistry', label: t('chemistry'), icon: Dna, color: 'bg-green-500' },
    { value: 'biology', label: t('biology'), icon: Dna, color: 'bg-emerald-500' },
    { value: 'english', label: t('english'), icon: FileText, color: 'bg-indigo-500' },
    { value: 'history', label: t('history'), icon: History, color: 'bg-amber-500' },
    { value: 'geography', label: t('geography'), icon: Globe, color: 'bg-teal-500' },
    { value: 'computer science', label: t('computerScience'), icon: Computer, color: 'bg-gray-500' },
    { value: 'literature', label: t('literature'), icon: BookMarked, color: 'bg-pink-500' },
    { value: 'economics', label: t('economics'), icon: TrendingUp, color: 'bg-orange-500' },
    { value: 'psychology', label: t('psychology'), icon: Brain, color: 'bg-violet-500' },
    { value: 'sociology', label: t('sociology'), icon: Users, color: 'bg-rose-500' },
    { value: 'custom', label: language === 'en' ? 'Other Subject' : 'अन्य विषय', icon: Plus, color: 'bg-slate-500' }
  ];

  const assistModes = [
    {
      value: 'stepByStep',
      label: t('stepByStep'),
      description: language === 'en' ? 'Detailed explanation with steps' : 'चरणों के साथ विस्तृत व्याख्या',
      icon: '📝',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      value: 'hint',
      label: t('justHint'),
      description: language === 'en' ? 'Get a helpful hint to start' : 'शुरुआत के लिए सहायक संकेत',
      icon: '💡',
      color: 'bg-amber-50 border-amber-200 text-amber-800'
    },
    {
      value: 'check',
      label: t('checkWork'),
      description: language === 'en' ? 'Verify your solution' : 'अपने समाधान की जाँच करें',
      icon: '✅',
      color: 'bg-green-50 border-green-200 text-green-800'
    }
  ];

  const quickTips = [
    { 
      text: language === 'en' ? 'Be specific about what you need help with' : 'जिस चीज़ में मदद चाहिए उसके बारे में स्पष्ट रूप से बताएं',
      icon: '🎯'
    },
    { 
      text: language === 'en' ? 'Include any formulas or data given' : 'दिए गए सूत्र या डेटा को शामिल करें',
      icon: '📊'
    },
    { 
      text: language === 'en' ? 'Mention your current understanding level' : 'अपने वर्तमान समझ के स्तर का उल्लेख करें',
      icon: '📈'
    }
  ];

  const handleGetHelp = () => {
    const finalSubject = subject === 'custom' ? customSubject : subject;
    
    if (!problem.trim()) {
      toast.error(language === 'en' ? 'Please enter your homework problem' : 'कृपया अपनी होमवर्क समस्या दर्ज करें');
      return;
    }

    if (!finalSubject.trim()) {
      toast.error(language === 'en' ? 'Please select or enter a subject' : 'कृपया एक विषय चुनें या दर्ज करें');
      return;
    }

    setIsLoading(true);
    let prompt = '';
    
    const urgencyText = urgency === 'urgent' 
      ? (language === 'en' ? ' This is urgent.' : ' यह जरूरी है।')
      : '';
    
    if (language === 'en') {
      if (assistMode === 'stepByStep') {
        prompt = `I need help with this ${finalSubject} problem: "${problem}". Please explain the solution step by step, showing all work and explaining the reasoning at each stage. Don't just give me the final answer.${urgencyText}`;
      } else if (assistMode === 'hint') {
        prompt = `I'm working on this ${finalSubject} problem: "${problem}". Please give me a hint or starting point without solving it completely. I want to try solving it myself.${urgencyText}`;
      } else if (assistMode === 'check') {
        prompt = `I solved this ${finalSubject} problem: "${problem}". Can you check if my approach and solution are correct? If there are any errors, please explain what went wrong and how to fix it.${urgencyText}`;
      }
    } else {
      const hindiSubject = getHindiSubjectName(finalSubject);
      if (assistMode === 'stepByStep') {
        prompt = `मुझे इस ${hindiSubject} की समस्या में मदद चाहिए: "${problem}". कृपया समाधान को चरण-दर-चरण समझाएं, सभी कार्य दिखाएं और प्रत्येक चरण पर तर्क की व्याख्या करें। मुझे केवल अंतिम उत्तर ही न दें।${urgencyText}`;
      } else if (assistMode === 'hint') {
        prompt = `मैं इस ${hindiSubject} की समस्या पर काम कर रहा हूँ: "${problem}". कृपया मुझे इसे पूरी तरह से हल किए बिना एक संकेत या शुरुआती बिंदु दें। मैं इसे खुद हल करने की कोशिश करना चाहता हूँ।${urgencyText}`;
      } else if (assistMode === 'check') {
        prompt = `मैंने इस ${hindiSubject} की समस्या को हल किया: "${problem}". क्या आप जांच कर सकते हैं कि मेरा दृष्टिकोण और समाधान सही है? यदि कोई त्रुटियां हैं, तो कृपया बताएं कि क्या गलत हुआ और इसे कैसे ठीक किया जाए।${urgencyText}`;
      }
    }
    
    onSendMessage(prompt);
    setIsLoading(false);
    toast.success(language === 'en' ? 'Getting homework help...' : 'होमवर्क सहायता प्राप्त कर रहे हैं...');
  };

  const getHindiSubjectName = (englishSubject: string): string => {
    const subjectMap: {[key: string]: string} = {
      'math': 'गणित',
      'physics': 'भौतिकी',
      'chemistry': 'रसायन विज्ञान',
      'biology': 'जीव विज्ञान',
      'english': 'अंग्रेज़ी',
      'history': 'इतिहास',
      'geography': 'भूगोल',
      'computer science': 'कंप्यूटर विज्ञान',
      'literature': 'साहित्य',
      'economics': 'अर्थशास्त्र',
      'psychology': 'मनोविज्ञान',
      'sociology': 'समाजशास्त्र'
    };
    return subjectMap[englishSubject] || englishSubject;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {t('homeworkAssistant')}
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('homeworkDescription')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Star className="h-5 w-5" />
              {language === 'en' ? 'Quick Tips for Better Help' : 'बेहतर सहायता के लिए त्वरित सुझाव'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <span className="text-lg">{tip.icon}</span>
                  <span className="text-sm text-amber-700 dark:text-amber-300">{tip.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {language === 'en' ? 'Get Homework Help' : 'होमवर्क सहायता प्राप्त करें'}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {language === 'en' ? 'Tell us about your problem and get personalized assistance' : 'अपनी समस्या के बारे में बताएं और व्यक्तिगत सहायता प्राप्त करें'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Subject Selection */}
            <div className="space-y-4">
              <label className="text-lg font-semibold flex items-center gap-2">
                <span className="text-red-500">*</span>
                {t('subject')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {predefinedSubjects.map((subj) => {
                  const IconComponent = subj.icon;
                  return (
                    <motion.div
                      key={subj.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all border-2 ${
                          subject === subj.value 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSubject(subj.value)}
                      >
                        <CardContent className="p-3 text-center">
                          <div className={`w-10 h-10 ${subj.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-medium">{subj.label}</span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
              
              {subject === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    placeholder={language === 'en' ? "Enter your subject" : "अपना विषय दर्ज करें"}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="border-2 focus:border-blue-500"
                  />
                </motion.div>
              )}
            </div>

            <Separator />

            {/* Problem Description */}
            <div className="space-y-3">
              <label className="text-lg font-semibold flex items-center gap-2">
                <span className="text-red-500">*</span>
                {t('yourProblem')}
              </label>
              <Textarea
                placeholder={t('problemPlaceholder')}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={4}
                className="resize-none border-2 focus:border-blue-500"
              />
            </div>

            <Separator />

            {/* Help Type Selection */}
            <div className="space-y-4">
              <label className="text-lg font-semibold">{t('helpType')}</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assistModes.map((mode) => (
                  <motion.div
                    key={mode.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all border-2 ${
                        assistMode === mode.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setAssistMode(mode.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{mode.icon}</div>
                        <h3 className="font-semibold mb-1">{mode.label}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{mode.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Urgency Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {language === 'en' ? 'Urgency Level' : 'तात्कालिकता स्तर'}
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={urgency === 'normal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUrgency('normal')}
                    className="flex-1"
                  >
                    {language === 'en' ? 'Normal' : 'सामान्य'}
                  </Button>
                  <Button
                    type="button"
                    variant={urgency === 'urgent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUrgency('urgent')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {language === 'en' ? 'Urgent' : 'तत्काल'}
                  </Button>
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button 
                onClick={handleGetHelp} 
                disabled={isLoading || !problem.trim() || (!subject || (subject === 'custom' && !customSubject.trim()))} 
                className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    {t('processing')}
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-5 w-5" />
                    {t('getHelp')}
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <h3 className="font-semibold text-green-800 dark:text-green-200">
            {language === 'en' ? 'Smart Hints' : 'स्मार्ट संकेत'}
          </h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            {language === 'en' ? 'Get helpful hints without spoilers' : 'बिना स्पॉयलर के सहायक संकेत'}
          </p>
        </Card>

        <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
            {language === 'en' ? 'Step-by-Step' : 'चरण-दर-चरण'}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            {language === 'en' ? 'Detailed explanations for learning' : 'सीखने के लिए विस्तृत व्याख्या'}
          </p>
        </Card>

        <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <Star className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <h3 className="font-semibold text-purple-800 dark:text-purple-200">
            {language === 'en' ? 'Work Verification' : 'कार्य सत्यापन'}
          </h3>
          <p className="text-sm text-purple-600 dark:text-purple-300">
            {language === 'en' ? 'Check your solutions for accuracy' : 'सटीकता के लिए अपने समाधान जांचें'}
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default HomeworkAssistant;
