
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Brain, GraduationCap, User, MessageSquare, Plus, School, Trophy, Target, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConversationContext } from '@/hooks/interactive-teacher/types';
import { motion } from 'framer-motion';

interface InteractiveTeacherSetupProps {
  onStartLesson: (prompt: string, context: Partial<ConversationContext>) => void;
  isProcessing: boolean;
}

const InteractiveTeacherSetup: React.FC<InteractiveTeacherSetupProps> = ({
  onStartLesson,
  isProcessing
}) => {
  const { language } = useLanguage();
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [studentName, setStudentName] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('beginner');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [learningMode, setLearningMode] = useState('interactive');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  const subjects = [
    'गणित (Mathematics)',
    'भौतिक विज्ञान (Physics)', 
    'रसायन विज्ञान (Chemistry)',
    'जीव विज्ञान (Biology)',
    'इतिहास (History)',
    'भूगोल (Geography)',
    'अर्थशास्त्र (Economics)',
    'राजनीति विज्ञान (Political Science)',
    'अंग्रेजी (English)',
    'हिंदी (Hindi)',
    'कंप्यूटर साइंस (Computer Science)',
    'custom'
  ];

  const difficultyLevels = [
    { 
      value: 'beginner', 
      label: language === 'en' ? 'Beginner' : 'शुरुआती',
      icon: '🌱',
      color: 'from-green-500 to-emerald-500',
      description: language === 'en' ? 'Simple & basic concepts' : 'सरल और बुनियादी अवधारणाएं'
    },
    { 
      value: 'medium', 
      label: language === 'en' ? 'Intermediate' : 'मध्यम',
      icon: '📚',
      color: 'from-yellow-500 to-orange-500',
      description: language === 'en' ? 'Moderate complexity' : 'मध्यम जटिलता'
    },
    { 
      value: 'advanced', 
      label: language === 'en' ? 'Advanced' : 'उन्नत',
      icon: '🎓',
      color: 'from-red-500 to-pink-500',
      description: language === 'en' ? 'Complex & detailed' : 'जटिल और विस्तृत'
    }
  ];

  const learningModes = [
    { 
      value: 'interactive', 
      label: language === 'en' ? 'Interactive' : 'इंटरैक्टिव',
      icon: '🤝',
      color: 'from-blue-500 to-cyan-500',
      description: language === 'en' ? 'Q&A based learning' : 'प्रश्न-उत्तर आधारित सीखना'
    },
    { 
      value: 'storytelling', 
      label: language === 'en' ? 'Story Mode' : 'कहानी मोड',
      icon: '📖',
      color: 'from-purple-500 to-pink-500',
      description: language === 'en' ? 'Learn through stories' : 'कहानियों के माध्यम से सीखें'
    },
    { 
      value: 'practical', 
      label: language === 'en' ? 'Practical' : 'व्यावहारिक',
      icon: '🔬',
      color: 'from-orange-500 to-red-500',
      description: language === 'en' ? 'Hands-on examples' : 'व्यावहारिक उदाहरण'
    }
  ];

  const handleStartLesson = () => {
    const selectedSubject = subject === 'custom' ? customSubject : subject;
    
    if (!selectedSubject || !chapter) {
      return;
    }

    const context: Partial<ConversationContext> = {
      subject: selectedSubject,
      chapter,
      studentName: studentName || 'Student',
      priorKnowledge,
      selectedDifficulty,
      learningMode,
      additionalRequirements
    };

    const difficultyText = selectedDifficulty === 'beginner' ? 'शुरुआती स्तर' : 
                          selectedDifficulty === 'medium' ? 'मध्यम स्तर' : 'उन्नत स्तर';

    const modeText = learningMode === 'interactive' ? 'इंटरैक्टिव तरीके से' : 
                     learningMode === 'storytelling' ? 'कहानी के माध्यम से' : 'व्यावहारिक उदाहरणों के साथ';

    const prompt = `
आप एक अनुभवी और धैर्यवान शिक्षक हैं जो ${selectedSubject} विषय में ${chapter} टॉपिक पढ़ा रहे हैं।

छात्र का विवरण:
- नाम: ${studentName || 'Student'}
- पूर्व ज्ञान स्तर: ${priorKnowledge === 'beginner' ? 'शुरुआती - पहली बार सीख रहा हूं' : 'अनुभवी - पहले से कुछ जानकारी है'}
- कठिनाई स्तर: ${difficultyText}
- सीखने का तरीका: ${modeText}
${additionalRequirements ? `- अतिरिक्त आवश्यकताएं: ${additionalRequirements}` : ''}

महत्वपूर्ण निर्देश (बिगिनर स्टूडेंट के लिए):
1. केवल उसी टॉपिक से प्रश्न पूछें जो आपने पहले पढ़ाया है
2. हर टॉपिक खत्म होने पर पूछें: "क्या हम आगे बढ़ सकते हैं?" या "क्या आपको यह समझ में आया?"
3. बीच में कोई प्रश्न न पूछें, सिर्फ समझ की पुष्टि करें
4. अगर स्टूडेंट को समझ नहीं आता, तो उसी टॉपिक को और विस्तार से समझाएं
5. चैप्टर पूरा होने पर ही उस चैप्टर से प्रश्न पूछें
6. आप ही तय करेंगे कि अगला टॉपिक क्या होगा
7. ${difficultyText} के अनुसार समझाएं
8. ${modeText} पढ़ाएं

अब ${chapter} टॉपिक की शुरुआत करें और बिल्कुल बेसिक्स से समझाना शुरू करें।
`;

    onStartLesson(prompt, context);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="relative overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6" />
              <div>
                <h3 className="text-xl font-bold">Live Teaching</h3>
                <p className="text-indigo-100">
                  {language === 'hi' 
                    ? 'व्यक्तिगत शिक्षक के साथ लाइव पढ़ाई का अनुभव' 
                    : 'Experience live learning with a personal teacher'}
                </p>
              </div>
            </div>
            <Trophy className="h-8 w-8 text-yellow-300 animate-bounce" />
          </div>
        </div>

        <CardContent className="p-6 space-y-6 relative z-10">
          {/* Student Name */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <Label htmlFor="studentName" className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <User className="h-4 w-4" />
                {language === 'hi' ? 'आपका नाम (वैकल्पिक)' : 'Your Name (Optional)'}
              </Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Subject Selection */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <BookOpen className="h-4 w-4" />
                  {language === 'hi' ? 'विषय चुनें' : 'Select Subject'}
                </Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500">
                    <SelectValue placeholder={language === 'hi' ? 'विषय चुनें' : 'Choose a subject'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj === 'custom' ? (language === 'hi' ? 'अन्य विषय' : 'Custom Subject') : subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Subject Input */}
              {subject === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customSubject" className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    {language === 'hi' ? 'अपना विषय लिखें' : 'Enter Your Subject'}
                  </Label>
                  <Input
                    id="customSubject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder={language === 'hi' ? 'जैसे: कला, संगीत, खेल...' : 'e.g: Art, Music, Sports...'}
                    className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              )}

              {/* Chapter Input */}
              <div className="space-y-2">
                <Label htmlFor="chapter" className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Brain className="h-4 w-4" />
                  {language === 'hi' ? 'चैप्टर/टॉपिक' : 'Chapter/Topic'}
                </Label>
                <Input
                  id="chapter"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: बीजगणित, प्रकाश, कोशिका...' : 'e.g: Algebra, Light, Cell...'}
                  className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-orange-700 dark:text-orange-400 font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                {language === 'hi' ? 'कठिनाई स्तर' : 'Difficulty Level'}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {difficultyLevels.map((level) => (
                  <motion.button
                    key={level.value}
                    type="button"
                    onClick={() => setSelectedDifficulty(level.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === level.value
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg'
                        : 'border-gray-200 hover:border-orange-300 bg-white/70 dark:bg-gray-800/70'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${level.color} flex items-center justify-center text-white font-bold mb-2 mx-auto`}>
                      {level.icon}
                    </div>
                    <h5 className="font-semibold text-sm mb-1">{level.label}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{level.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Mode */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border-2 border-teal-200 dark:border-teal-800">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {language === 'hi' ? 'सीखने का तरीका' : 'Learning Mode'}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {learningModes.map((mode) => (
                  <motion.button
                    key={mode.value}
                    type="button"
                    onClick={() => setLearningMode(mode.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      learningMode === mode.value
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-lg'
                        : 'border-gray-200 hover:border-teal-300 bg-white/70 dark:bg-gray-800/70'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center text-white font-bold mb-2 mx-auto`}>
                      {mode.icon}
                    </div>
                    <h5 className="font-semibold text-sm mb-1">{mode.label}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{mode.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Prior Knowledge Level */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-400 font-semibold">
                {language === 'hi' ? 'पूर्व ज्ञान स्तर' : 'Prior Knowledge Level'}
              </Label>
              <RadioGroup value={priorKnowledge} onValueChange={setPriorKnowledge}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="text-sm font-normal cursor-pointer">
                    {language === 'hi' ? 'शुरुआती - पहली बार सीख रहा हूं' : 'Beginner - Learning for the first time'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="text-sm font-normal cursor-pointer">
                    {language === 'hi' ? 'अनुभवी - पहले से कुछ जानकारी है' : 'Experienced - Have some prior knowledge'}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Additional Requirements */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-violet-200 dark:border-violet-800">
            <div className="space-y-2">
              <Label htmlFor="additionalRequirements" className="text-sm font-medium flex items-center gap-2 text-violet-700 dark:text-violet-400 font-semibold">
                <Plus className="h-4 w-4" />
                {language === 'hi' ? 'अतिरिक्त आवश्यकताएं (वैकल्पिक)' : 'Additional Requirements (Optional)'}
              </Label>
              <Textarea
                id="additionalRequirements"
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder={language === 'hi' 
                  ? 'जैसे: टॉपिक को और गहराई से समझाएं, व्यावहारिक उदाहरण दें, धीरे-धीरे समझाएं...' 
                  : 'e.g: Explain topics in more depth, provide practical examples, explain slowly...'}
                className="min-h-[80px] bg-white/70 dark:bg-gray-800/70 border-violet-200 dark:border-violet-700 focus:ring-violet-500 focus:border-violet-500"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {language === 'hi' 
                  ? 'यहां बताएं कि आप चाहते हैं कि शिक्षक किस तरह से पढ़ाए' 
                  : 'Describe how you want the teacher to conduct the lesson'}
              </p>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartLesson}
            disabled={!subject || (!customSubject && subject === 'custom') || !chapter || isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 relative group overflow-hidden py-3 text-lg font-medium"
          >
            {/* Animated background effect */}
            <span className="absolute inset-0 w-full h-full transition-all duration-300 scale-x-0 translate-x-0 bg-white/10 group-hover:scale-x-100 group-hover:translate-x-full ease-out origin-left"></span>
            
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                {language === 'hi' ? 'Live Teaching शुरू हो रहा है...' : 'Starting Live Teaching...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <div className="relative">
                  <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-yellow-300 rounded-full animate-ping opacity-70"></span>
                </div>
                {language === 'hi' ? 'Live Teaching शुरू करें' : 'Start Live Teaching'}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InteractiveTeacherSetup;
