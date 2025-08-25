
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { School, Trophy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { TeacherFormValues } from './types';

// Import sub-components
import StudentNameField from './StudentNameField';
import SubjectFields from './SubjectFields';
import AudioControls from './AudioControls';
import TeachingStyleRadio from './TeachingStyleRadio';
import CategoryRadio from './CategoryRadio';
import ActionRadio from './ActionRadio';
import SubmitButton from './SubmitButton';
import StudentQuestion from './StudentQuestion';
import AlternativeClassesField from './AlternativeClassesField';
import LearningPreferences from './LearningPreferences';
import EnhancedFeatures from './EnhancedFeatures';

interface ClassicTeacherFormProps {
  onSendMessage: (message: string) => void;
  useVoiceResponse: boolean;
  setUseVoiceResponse: (value: boolean) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (value: string) => void;
  learningMode: string;
  setLearningMode: (value: string) => void;
}

const ClassicTeacherForm: React.FC<ClassicTeacherFormProps> = ({
  onSendMessage,
  useVoiceResponse,
  setUseVoiceResponse,
  selectedDifficulty,
  setSelectedDifficulty,
  learningMode,
  setLearningMode
}) => {
  const { t, language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customSubject, setCustomSubject] = useState(false);
  const isTTSEnabled = false;
  const { isListening, toggleListening } = useSpeechRecognition(language);

  const form = useForm<TeacherFormValues>({
    defaultValues: {
      subject: '',
      customSubjectText: '',
      chapter: '',
      studentName: '',
      teachingStyle: 'teacher',
      category: 'concise',
      action: 'read',
      voiceInteraction: 'enabled',
      alternativeClasses: ''
    }
  });

  const handleSubjectChange = (value: string) => {
    form.setValue('subject', value);
    setCustomSubject(value === 'custom');
  };

  const sendStudentQuestion = () => {
    const questionField = document.getElementById('student-question') as HTMLInputElement;
    if (questionField && questionField.value.trim()) {
      const studentName = form.getValues('studentName') || t('studentName');
      
      const question = language === 'hi' 
        ? `मैं ${studentName} हूँ और मुझे आपसे एक सवाल पूछना है: "${questionField.value.trim()}" कृपया मुझे एक असली शिक्षक की तरह जवाब दें, जैसे कि हम एक असली कक्षा में हैं।`
        : `Teacher, this is ${studentName} raising my hand with a question: "${questionField.value.trim()}" Please explain it to me as if we're in a real classroom.`;
      
      const voiceInstruction = useVoiceResponse
        ? (language === 'hi' 
          ? ' कृपया बिल्कुल वैसे ही जवाब दें जैसे आप कक्षा में खड़े होकर सीधे मुझसे बात कर रहे हैं। ऐसा लगना चाहिए कि आप एक असली शिक्षक हैं।' 
          : ' Please respond exactly as you would if you were standing in a classroom speaking directly to me. Sound like a real teacher addressing their student.')
        : '';
      
      onSendMessage(question + voiceInstruction);
      questionField.value = '';
      
      toast.success(language === 'hi' 
        ? 'शिक्षक आपका प्रश्न देख रहे हैं...' 
        : 'Teacher is looking at your question...', 
        { duration: 3000 }
      );
    } else {
      toast.error(language === 'hi' ? 'कृपया एक प्रश्न दर्ज करें' : 'Please enter a question');
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    setIsProcessing(true);
    
    const selectedSubject = customSubject ? data.customSubjectText : data.subject;
    
    const teachingStyle = data.teachingStyle === 'teacher' 
      ? (language === 'hi' 
        ? `आप एक वास्तविक, अनुभवी और प्रेरणादायक शिक्षक हैं जो "${data.studentName || t('studentName')}" के नाम से मुझे संबोधित करते हैं। आप हमेशा उत्साहित रहते हैं, मुझसे प्रश्न पूछते हैं, उदाहरण देते हैं, और यह सुनिश्चित करते हैं कि मैं समझ रहा हूं। आप बिल्कुल वैसे ही बोलते हैं जैसे एक असली शिक्षक कक्षा में अपने छात्र से बात करता है। आप धैर्यवान हैं, प्रोत्साहन देते हैं, और जटिल विषयों को सरल बनाते हैं।`
        : `You are a real, experienced, and inspiring teacher who addresses me directly as "${data.studentName || t('studentName')}" throughout our lesson. You are always enthusiastic, ask me questions to check understanding, give examples, and ensure I'm following along. You speak exactly like a real teacher would in a classroom with their student. You are patient, encouraging, and make complex topics simple and engaging.`)
      : (language === 'hi'
        ? 'मानक शैक्षणिक शैली में जानकारी प्रदान करें'
        : 'Provide information in standard educational format');
      
    const category = data.category === 'concise'
      ? (language === 'hi'
        ? 'संक्षिप्त लेकिन पूर्ण व्याख्या दें, मुख्य बिंदुओं पर ध्यान दें'
        : 'Give a concise but complete explanation, focusing on key points')
      : (language === 'hi'
        ? 'विस्तृत और गहन व्याख्या दें, जैसे एक पूरा पाठ हो'
        : 'Give a detailed and thorough explanation, like a complete lesson');
      
    const action = data.action === 'notes'
      ? (language === 'hi'
        ? 'अध्ययन नोट्स तैयार करें और उन्हें व्यवस्थित तरीके से प्रस्तुत करें'
        : 'Create organized study notes and present them systematically')
      : (language === 'hi'
        ? 'विषय को एक रोचक पाठ के रूप में पढ़ाएं'
        : 'Teach the topic as an engaging lesson');
    
    const difficultyInstruction = selectedDifficulty === 'beginner'
      ? (language === 'hi' ? 'बहुत सरल भाषा में, बुनियादी स्तर पर समझाएं' : 'Explain in very simple terms, at a basic level')
      : selectedDifficulty === 'advanced'
      ? (language === 'hi' ? 'उन्नत स्तर पर गहराई से समझाएं' : 'Explain at an advanced level with depth')
      : (language === 'hi' ? 'मध्यम स्तर पर संतुलित व्याख्या दें' : 'Give a balanced explanation at intermediate level');

    const learningModeInstruction = learningMode === 'storytelling'
      ? (language === 'hi' ? 'कहानियों और उदाहरणों के माध्यम से पढ़ाएं' : 'Teach through stories and examples')
      : learningMode === 'practical'
      ? (language === 'hi' ? 'व्यावहारिक उदाहरण और प्रयोग शामिल करें' : 'Include practical examples and experiments')
      : (language === 'hi' ? 'इंटरैक्टिव प्रश्न-उत्तर के साथ पढ़ाएं' : 'Teach with interactive Q&A');

    const voiceResponseRequest = useVoiceResponse
      ? (language === 'hi'
        ? '\n\nमैं आपके उत्तर को आवाज में सुनूंगा, इसलिए कृपया ऐसे शब्दों का प्रयोग करें जो बोलने पर प्राकृतिक लगें। छोटे वाक्य बनाएं और ऐसे बोलें जैसे आप वास्तव में कक्षा में पढ़ा रहे हों।'
        : '\n\nI will be listening to your response, so please use words that sound natural when spoken. Use short sentences and speak as if you are actually teaching in a classroom.')
      : '';

    const alternativeClassesInstruction = data.alternativeClasses 
      ? (language === 'hi'
        ? `\n\nवैकल्पिक शिक्षण दृष्टिकोण: ${data.alternativeClasses} - कृपया इन वैकल्पिक तरीकों को भी अपने शिक्षण में शामिल करें।`
        : `\n\nAlternative Teaching Approaches: ${data.alternativeClasses} - Please incorporate these alternative methods into your teaching.`)
      : '';
    
    let prompt = '';
    
    if (language === 'hi') {
      prompt = `${teachingStyle}

विषय: ${selectedSubject}
अध्याय/टॉपिक: ${data.chapter}
छात्र का नाम: ${data.studentName || t('studentName')}
कठिनाई स्तर: ${difficultyInstruction}
सीखने का तरीका: ${learningModeInstruction}
शिक्षण शैली: ${data.teachingStyle === 'teacher' ? 'वास्तविक शिक्षक मोड - अत्यधिक इंटरैक्टिव और प्रेरणादायक' : 'मानक शिक्षण'}
विवरण स्तर: ${category}
कार्य: ${action}

${data.teachingStyle === 'teacher' ? `कृपया मुझे "${data.studentName || t('studentName')}" के नाम से पुकारें और बिल्कुल एक असली शिक्षक की तरह पढ़ाएं। बीच-बीच में मुझसे सवाल पूछें जैसे "क्या आप समझ गए?", "कोई प्रश्न है?", "इसका क्या मतलब है आपके हिसाब से?" आदि। उत्साह दिखाएं, प्रोत्साहन दें, और व्यावहारिक उदाहरण दें। ऐसे बोलें जैसे हम वास्तव में एक कक्षा में बैठे हैं।` : ''}${voiceResponseRequest}${alternativeClassesInstruction}`;
    } else {
      prompt = `${teachingStyle}

Subject: ${selectedSubject}
Chapter/Topic: ${data.chapter}
Student Name: ${data.studentName || t('studentName')}
Difficulty Level: ${difficultyInstruction}
Learning Mode: ${learningModeInstruction}
Teaching Style: ${data.teachingStyle === 'teacher' ? 'Real Teacher Mode - Highly Interactive & Inspiring' : 'Standard Teaching'}
Detail Level: ${category}
Action: ${action}

${data.teachingStyle === 'teacher' ? `Please call me "${data.studentName || t('studentName')}" and teach exactly like a real teacher would. Ask me questions periodically like "Do you understand so far?", "Any questions?", "What do you think this means?" etc. Show enthusiasm, give encouragement, and provide practical examples. Speak as if we're actually sitting in a real classroom together.` : ''}${voiceResponseRequest}${alternativeClassesInstruction}`;
    }
    
    onSendMessage(prompt);
    setIsProcessing(false);
    
    toast.success(
      <div className="flex items-center">
        <School className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
        <span>{language === 'hi' ? 'शिक्षक आपका पाठ तैयार कर रहे हैं...' : 'Teacher is preparing your lesson...'}</span>
      </div>, 
      { duration: 3000 }
    );
  });

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
              <School className="h-6 w-6" />
              <div>
                <h3 className="text-xl font-bold">{language === 'hi' ? 'अपना शिक्षक सेट करें' : 'Set Up Your Teacher'}</h3>
                <p className="text-indigo-100">{language === 'hi' ? 'व्यक्तिगत शिक्षा अनुभव के लिए विवरण भरें' : 'Fill details for personalized learning experience'}</p>
              </div>
            </div>
            <Trophy className="h-8 w-8 text-yellow-300 animate-bounce" />
          </div>
        </div>
        
        <CardContent className="p-6 space-y-6 relative z-10">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                <StudentNameField form={form} />
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                <SubjectFields 
                  form={form} 
                  customSubject={customSubject} 
                  onSubjectChange={handleSubjectChange} 
                />
              </div>

              <LearningPreferences 
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                learningMode={learningMode}
                setLearningMode={setLearningMode}
              />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-800">
                  <TeachingStyleRadio form={form} />
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-4 border-2 border-pink-200 dark:border-pink-800">
                  <CategoryRadio form={form} />
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
                  <ActionRadio form={form} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                  <AudioControls 
                    isTTSEnabled={isTTSEnabled} 
                    useVoiceResponse={useVoiceResponse} 
                    toggleTTS={() => {}} 
                    setUseVoiceResponse={setUseVoiceResponse} 
                  />
                </div>
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-violet-200 dark:border-violet-800">
                  <AlternativeClassesField form={form} />
                </div>
              </div>

              <SubmitButton isProcessing={isProcessing} />
            </form>
          </Form>

          <StudentQuestion 
            isListening={isListening} 
            toggleListening={() => toggleListening('student-question')} 
            sendStudentQuestion={sendStudentQuestion} 
          />
          
          <EnhancedFeatures />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClassicTeacherForm;
