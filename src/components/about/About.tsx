
import React, { useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Brain, 
  Calculator, 
  GraduationCap, 
  BookOpenCheck,
  FileText,
  Clock,
  UserPlus,
  Lock,
  Mail,
  Target,
  Star,
  Languages,
  HelpCircle,
  Phone
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const About = () => {
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  // Function to toggle language
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const isHindi = language === 'hi';

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with language toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {isHindi ? 'स्टडी AI के बारे में' : 'About Study AI'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isHindi ? 'आपका व्यक्तिगत अध्ययन सहायक' : 'Your personal study assistant'}
            </p>
          </div>
          
          <Button 
            onClick={toggleLanguage} 
            variant="outline" 
            className="flex items-center gap-2 border-purple-200 dark:border-purple-800"
          >
            <Languages className="h-4 w-4" />
            {isHindi ? 'English' : 'हिंदी'}
          </Button>
        </div>
        
        {/* Tabs for navigation */}
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="mb-8"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto">
            <TabsTrigger value="overview" className="py-2">
              {isHindi ? 'परिचय' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="features" className="py-2">
              {isHindi ? 'सुविधाएँ' : 'Features'}
            </TabsTrigger>
            <TabsTrigger value="guide" className="py-2">
              {isHindi ? 'उपयोग गाइड' : 'User Guide'}
            </TabsTrigger>
            <TabsTrigger value="faq" className="py-2">
              {isHindi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'FAQ'}
            </TabsTrigger>
            <TabsTrigger value="contact" className="py-2">
              {isHindi ? 'संपर्क करें' : 'Contact'}
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 rounded-lg border border-purple-100 dark:border-purple-800">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-purple-800 dark:text-purple-300">
                  <BookOpen className="h-6 w-6" />
                  {isHindi ? 'स्टडी AI - एक परिचय' : 'Study AI - An Introduction'}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {isHindi 
                    ? 'स्टडी AI एक उन्नत AI-संचालित अध्ययन सहायक है जो विद्यार्थियों को उनकी शैक्षिक यात्रा में मदद करने के लिए डिज़ाइन किया गया है। हमारा AI सहायक छात्रों को किसी भी विषय में प्रश्न पूछने, नोट्स तैयार करने, अध्ययन योजनाएं बनाने, होमवर्क में सहायता प्राप्त करने और परीक्षा की तैयारी करने की अनुमति देता है। हमारा लक्ष्य शिक्षा को अधिक सुलभ, व्यक्तिगत और प्रभावी बनाना है।'
                    : 'Study AI is an advanced AI-powered study assistant designed to help students in their educational journey. Our AI assistant allows students to ask questions on any subject, create notes, generate study plans, get homework assistance, and prepare for exams. Our goal is to make education more accessible, personalized, and effective.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard 
                  icon={<Brain className="h-6 w-6 text-purple-500" />}
                  title={isHindi ? 'स्मार्ट अध्ययन' : 'Smart Learning'}
                  description={isHindi 
                    ? 'AI अनुकूलित अध्ययन अनुभव के साथ अपनी सीखने की क्षमता को बढ़ाएं'
                    : 'Enhance your learning capabilities with AI-tailored study experiences'
                  }
                />
                <FeatureCard 
                  icon={<MessageSquare className="h-6 w-6 text-indigo-500" />}
                  title={isHindi ? 'इंटरएक्टिव चैट' : 'Interactive Chat'}
                  description={isHindi 
                    ? 'हमारे AI के साथ वार्तालाप करें और तुरंत अपने प्रश्नों के उत्तर प्राप्त करें'
                    : 'Converse with our AI and get instant answers to your questions'
                  }
                />
                <FeatureCard 
                  icon={<GraduationCap className="h-6 w-6 text-blue-500" />}
                  title={isHindi ? 'शिक्षक मोड' : 'Teacher Mode'}
                  description={isHindi 
                    ? 'वास्तविक शिक्षकों से जोड़ने और अतिरिक्त मार्गदर्शन प्राप्त करने की सुविधा'
                    : 'Features that connect with real teachers for additional guidance'
                  }
                />
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-xl font-semibold mb-3 text-indigo-700 dark:text-indigo-300">
                  {isHindi ? 'हमारा दृष्टिकोण' : 'Our Vision'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {isHindi 
                    ? 'स्टडी AI का मिशन शिक्षा के क्षेत्र में एक क्रांति लाना है। हम मानते हैं कि हर छात्र अद्वितीय है और सीखने की अपनी गति और शैली के अनुसार शिक्षा प्राप्त करने का अधिकार रखता है। AI की शक्ति का उपयोग करके, हम व्यक्तिगत शिक्षा अनुभव प्रदान करते हैं जो छात्रों की व्यक्तिगत जरूरतों के अनुकूल हैं।'
                    : 'Study AI\'s mission is to revolutionize the field of education. We believe that every student is unique and deserves education according to their own pace and style of learning. By harnessing the power of AI, we provide personalized educational experiences that adapt to students\' individual needs.'}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/30 dark:to-teal-900/30 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="text-xl font-semibold mb-3 text-blue-700 dark:text-blue-300">
                  {isHindi ? 'प्लेटफॉर्म विशेषताएँ' : 'Platform Highlights'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-full">
                      <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {isHindi ? 'स्मार्ट AI चैट' : 'Smart AI Chat'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isHindi 
                          ? 'प्रत्येक विषय के लिए व्यक्तिगत AI सहायता प्राप्त करें' 
                          : 'Get personalized AI assistance for every subject'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-purple-100 dark:bg-purple-900/50 p-1.5 rounded-full">
                      <BookOpenCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {isHindi ? 'अध्ययन रणनीति' : 'Study Strategies'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isHindi 
                          ? 'बेहतर अध्ययन के लिए उन्नत तकनीकें और रणनीतियाँ' 
                          : 'Advanced techniques and strategies for better learning'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-pink-100 dark:bg-pink-900/50 p-1.5 rounded-full">
                      <Clock className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {isHindi ? 'अध्ययन समय प्रबंधन' : 'Study Time Management'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isHindi 
                          ? 'पोमोडोरो टाइमर और फोकस ट्रैकिंग टूल्स' 
                          : 'Pomodoro timers and focus tracking tools'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 dark:bg-green-900/50 p-1.5 rounded-full">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {isHindi ? 'प्रगति ट्रैकिंग' : 'Progress Tracking'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isHindi 
                          ? 'अपनी अध्ययन यात्रा का विश्लेषण और प्रदर्शन सुधारें' 
                          : 'Analyze your study journey and improve performance'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Features Tab */}
          <TabsContent value="features" className="mt-6 space-y-8">
            <FeatureSection
              icon={<MessageSquare className="h-6 w-6 text-purple-500" />}
              title={isHindi ? 'AI चैट' : 'AI Chat'}
              description={isHindi
                ? 'स्टडी AI के साथ वार्तालाप करें और अपने अध्ययन से संबंधित प्रश्न पूछें। वास्तविक समय में प्रतिक्रिया प्राप्त करें।'
                : 'Converse with Study AI and ask questions related to your studies. Get real-time responses.'}
              features={[
                isHindi ? 'किसी भी विषय पर प्रश्न पूछें - गणित, विज्ञान, इतिहास, साहित्य आदि सभी विषयों पर AI से सहायता प्राप्त करें' : 'Ask questions on any subject - Get AI assistance on math, science, history, literature, and more',
                isHindi ? 'जटिल अवधारणाओं के सरल स्पष्टीकरण प्राप्त करें - AI कठिन विषयों को आसान भाषा में समझाता है' : 'Get simple explanations of complex concepts - AI explains difficult topics in easy language',
                isHindi ? 'मैसेज बुकमार्क करें और बाद में देखें - महत्वपूर्ण जानकारी को आसानी से सहेजें और एक्सेस करें' : 'Bookmark messages for later reference - Easily save and access important information',
                isHindi ? 'चैट इतिहास सहेजें और निर्यात करें - अपने सभी संवादों को PDF या टेक्स्ट फॉर्मेट में सहेजें' : 'Save and export chat history - Keep all your conversations in PDF or text format',
                isHindi ? 'अध्ययन सहायता के लिए टेक्स्ट/इमेज अपलोड करें - अपने नोट्स या प्रश्नपत्रों को अपलोड करें और AI से विश्लेषण प्राप्त करें' : 'Upload text/images for study assistance - Upload your notes or question papers and get AI analysis'
              ]}
            />

            <FeatureSection
              icon={<Calendar className="h-6 w-6 text-indigo-500" />}
              title={isHindi ? 'अध्ययन योजनाकार' : 'Study Planner'}
              description={isHindi
                ? 'अपने लक्ष्यों और समय सीमा के अनुसार व्यक्तिगत अध्ययन योजनाएं बनाएं। परीक्षाओं के लिए अच्छी तरह से तैयार रहें।'
                : 'Create personalized study plans according to your goals and deadlines. Stay well-prepared for exams.'}
              features={[
                isHindi ? 'परीक्षा तिथियों के अनुसार अनुकूलित अध्ययन समय-सारणी - अपनी परीक्षा तिथियों को दर्ज करें और AI आपकी पूरी अध्ययन योजना बनाएगा' : 'Customized study schedules based on exam dates - Enter your exam dates and AI will create your entire study plan',
                isHindi ? 'विषय और अध्याय-आधारित अध्ययन योजनाएं - प्रत्येक विषय और अध्याय के लिए उचित समय आवंटन' : 'Subject and chapter-based study plans - Proper time allocation for each subject and chapter',
                isHindi ? 'अध्ययन अनुस्मारक और प्रगति ट्रैकिंग - ईमेल या ऐप नोटिफिकेशन के माध्यम से अध्ययन अनुस्मारक प्राप्त करें' : 'Study reminders and progress tracking - Get study reminders through email or app notifications',
                isHindi ? 'आदतों के आधार पर अनुकूलित अध्ययन अवधि - अपनी अध्ययन आदतों और प्राथमिकताओं के अनुसार अनुकूलित योजनाएं' : 'Customized study sessions based on habits - Personalized plans according to your study habits and preferences',
                isHindi ? 'अध्ययन के लिए स्मार्ट ब्रेक सुझाव - अधिकतम फोकस और प्रभावशीलता के लिए इष्टतम ब्रेक टाइमिंग' : 'Smart break suggestions for studying - Optimal break timing for maximum focus and effectiveness'
              ]}
            />

            <FeatureSection
              icon={<FileText className="h-6 w-6 text-blue-500" />}
              title={isHindi ? 'नोट्स जनरेटर' : 'Notes Generator'}
              description={isHindi
                ? 'किसी भी विषय पर संक्षिप्त, व्यापक या परीक्षा-केंद्रित नोट्स तैयार करें। अपनी समझ को बेहतर बनाएं और परीक्षा की तैयारी करें।'
                : 'Generate concise, comprehensive, or exam-focused notes on any subject. Improve your understanding and prepare for exams.'}
              features={[
                isHindi ? 'कई प्रारूपों में नोट्स जनरेशन - अपनी आवश्यकता के अनुसार संक्षिप्त, विस्तृत या परीक्षा-केंद्रित नोट्स' : 'Note generation in multiple formats - Concise, detailed, or exam-focused notes according to your need',
                isHindi ? 'वैज्ञानिक, मानविकी, और तकनीकी विषयों के लिए अनुकूलित - सभी विषयों के लिए विशेष रूप से डिजाइन किया गया' : 'Tailored for scientific, humanities, and technical subjects - Specially designed for all subjects',
                isHindi ? 'आसान समझ के लिए चित्र और आरेख के साथ - जटिल अवधारणाओं को आसानी से समझने के लिए विज़ुअल एड्स' : 'With diagrams and illustrations for easy understanding - Visual aids for easy comprehension of complex concepts',
                isHindi ? 'नोट्स को साझा करने और निर्यात करने की क्षमता - अपने मित्रों के साथ नोट्स को आसानी से साझा करें' : 'Ability to share and export notes - Easily share notes with your friends',
                isHindi ? 'विभिन्न सीखने की शैलियों के लिए अनुकूलित - दृश्य, श्रवण, और कायस्थ सीखने वालों के लिए अनुकूलित सामग्री' : 'Adapted for different learning styles - Customized content for visual, auditory, and kinesthetic learners'
              ]}
            />

            <FeatureSection
              icon={<BookOpen className="h-6 w-6 text-green-500" />}
              title={isHindi ? 'क्विज़ जनरेटर' : 'Quiz Generator'}
              description={isHindi
                ? 'अपने ज्ञान का परीक्षण करने और अपनी कमजोरियों की पहचान करने के लिए अनुकूलित क्विज़ बनाएं।'
                : 'Create customized quizzes to test your knowledge and identify your weaknesses.'}
              features={[
                isHindi ? 'विभिन्न कठिनाई स्तरों के साथ प्रश्न - आसान, मध्यम और कठिन प्रश्नों के साथ अपने ज्ञान को चुनौती दें' : 'Questions with varying difficulty levels - Challenge your knowledge with easy, medium and hard questions',
                isHindi ? 'बहुविकल्पीय, सही-गलत, और लघु उत्तर प्रश्न - विभिन्न प्रकार के प्रश्न प्रारूपों का अनुभव करें' : 'Multiple choice, true-false, and short answer questions - Experience various types of question formats',
                isHindi ? 'विस्तृत व्याख्याओं के साथ उत्तर - हर सवाल के लिए विस्तृत स्पष्टीकरण प्राप्त करें' : 'Answers with detailed explanations - Get elaborate explanations for each question',
                isHindi ? 'प्रदर्शन विश्लेषण और सुधार सुझाव - अपने प्रदर्शन की समीक्षा करें और सुधार के लिए वैयक्तिकृत सुझाव पाएं' : 'Performance analysis and improvement suggestions - Review your performance and get personalized suggestions for improvement',
                isHindi ? 'अभ्यास मोड और टाइम्ड परीक्षण - बिना समय सीमा के अभ्यास करें या टाइम्ड परीक्षण के साथ वास्तविक परीक्षा का अनुभव करें' : 'Practice mode and timed tests - Practice without time limits or experience real exams with timed tests'
              ]}
            />

            <FeatureSection
              icon={<Calculator className="h-6 w-6 text-yellow-500" />}
              title={isHindi ? 'समस्या समाधानकर्ता' : 'Problem Solver'}
              description={isHindi
                ? 'चरण-दर-चरण समाधान के साथ गणित, विज्ञान, और अन्य विषयों की समस्याओं को हल करें।'
                : 'Solve problems in mathematics, science, and other subjects with step-by-step solutions.'}
              features={[
                isHindi ? 'अलजेब्रा, कैलकुलस, और सांख्यिकी - गणित की किसी भी शाखा में विस्तृत समाधान प्राप्त करें' : 'Algebra, calculus, and statistics - Get detailed solutions in any branch of mathematics',
                isHindi ? 'भौतिकी और रसायन विज्ञान समस्याएं - सूत्रों, आरेखों और व्याख्याओं के साथ विज्ञान में मदद पाएं' : 'Physics and chemistry problems - Get help in sciences with formulas, diagrams and explanations',
                isHindi ? 'प्रोग्रामिंग और कोडिंग सहायता - विभिन्न प्रोग्रामिंग भाषाओं में कोड के साथ संघर्ष करने पर मदद प्राप्त करें' : 'Programming and coding assistance - Get help when struggling with code in various programming languages',
                isHindi ? 'डिज़ाइन और इंजीनियरिंग परियोजनाएं - इंजीनियरिंग परियोजनाओं और डिज़ाइन चुनौतियों में मार्गदर्शन' : 'Design and engineering projects - Guidance in engineering projects and design challenges',
                isHindi ? 'व्यावसायिक और वित्तीय समस्याएं - वित्त, अर्थशास्त्र और व्यापार संबंधी प्रश्नों के लिए विशेषज्ञ सहायता' : 'Business and financial problems - Expert assistance for finance, economics, and business-related questions'
              ]}
            />

            <FeatureSection
              icon={<GraduationCap className="h-6 w-6 text-pink-500" />}
              title={isHindi ? 'शिक्षक मोड' : 'Teacher Mode'}
              description={isHindi
                ? 'छात्रों को शिक्षकों से जोड़ें और अतिरिक्त मार्गदर्शन और सहायता प्राप्त करें।'
                : 'Connect students with teachers and get additional guidance and assistance.'}
              features={[
                isHindi ? 'वास्तविक शिक्षकों के साथ चैट - विशेष विषयों पर प्रशिक्षित शिक्षकों से वास्तविक समय में बातचीत करें' : 'Chat with real teachers - Interact in real-time with trained teachers on specific subjects',
                isHindi ? 'विशेषज्ञों से प्रश्न पूछें - विशेष क्षेत्रों के विशेषज्ञों से जटिल प्रश्नों के उत्तर प्राप्त करें' : 'Ask questions from experts - Get answers to complex questions from experts in specialized fields',
                isHindi ? 'असाइनमेंट पर प्रतिक्रिया प्राप्त करें - अपने असाइनमेंट अपलोड करें और शिक्षकों से प्रतिक्रिया प्राप्त करें' : 'Get feedback on assignments - Upload your assignments and receive feedback from teachers',
                isHindi ? 'सामूहिक अध्ययन सत्र - मित्रों और शिक्षकों के साथ सामूहिक अध्ययन सत्र में शामिल हों' : 'Group study sessions - Join group study sessions with friends and teachers',
                isHindi ? 'अतिरिक्त अध्ययन संसाधनों तक पहुंच - शिक्षकों द्वारा अनुशंसित पुस्तकों, लेखों और वीडियो का उपयोग करें' : 'Access to additional study resources - Use books, articles, and videos recommended by teachers'
              ]}
            />

            <FeatureSection
              icon={<Clock className="h-6 w-6 text-orange-500" />}
              title={isHindi ? 'अध्ययन टाइमर और फोकस टूल्स' : 'Study Timer & Focus Tools'}
              description={isHindi
                ? 'प्रभावी अध्ययन सत्रों के लिए अपने समय का प्रबंधन करें और फोकस में सुधार करें।'
                : 'Manage your time for effective study sessions and improve focus.'}
              features={[
                isHindi ? 'पोमोडोरो टाइमर - 25 मिनट के अध्ययन सत्र और 5 मिनट के ब्रेक के साथ फोकस और उत्पादकता बढ़ाएं' : 'Pomodoro timer - Increase focus and productivity with 25-minute study sessions and 5-minute breaks',
                isHindi ? 'ब्रेक अनुस्मारक - लंबे अध्ययन सत्रों के दौरान स्वस्थ ब्रेक लेने के लिए अनुस्मारक' : 'Break reminders - Reminders to take healthy breaks during long study sessions',
                isHindi ? 'ध्यान बढ़ाने वाले अभ्यास - अध्ययन से पहले और ब्रेक के दौरान ध्यान केंद्रित करने के लिए अभ्यास' : 'Focus-enhancing exercises - Exercises to center your focus before studying and during breaks',
                isHindi ? 'लक्ष्य सेटिंग और ट्रैकिंग - दैनिक, साप्ताहिक और मासिक अध्ययन लक्ष्य निर्धारित करें और ट्रैक करें' : 'Goal setting and tracking - Set and track daily, weekly, and monthly study goals',
                isHindi ? 'अध्ययन सत्र विश्लेषण - अपने अध्ययन पैटर्न और प्रगति का विश्लेषण प्राप्त करें' : 'Study session analytics - Get analysis of your study patterns and progress'
              ]}
            />

            <FeatureSection
              icon={<BookOpenCheck className="h-6 w-6 text-purple-500" />}
              title={isHindi ? 'याददाश्त बढ़ाने वाले उपकरण' : 'Memory Enhancement Tools'}
              description={isHindi
                ? 'अपनी याददाश्त में सुधार करने और बेहतर स्मरण के लिए उपकरणों और तकनीकों का उपयोग करें।'
                : 'Use tools and techniques to improve your memory and recall.'}
              features={[
                isHindi ? 'फ्लैशकार्ड जनरेटर - कस्टम फ्लैशकार्ड बनाएं और स्पेस्ड रिपिटिशन तकनीक का उपयोग करके अध्ययन करें' : 'Flashcard generator - Create custom flashcards and study using spaced repetition technique',
                isHindi ? 'स्पेस्ड रिपिटिशन सिस्टम - दीर्घकालिक स्मृति में जानकारी संग्रहित करने के लिए वैज्ञानिक रूप से सिद्ध तकनीक' : 'Spaced repetition system - Scientifically proven technique for storing information in long-term memory',
                isHindi ? 'स्मरणीय संकेत और एसोसिएशन - जटिल जानकारी को याद रखने के लिए मनोनिक और एसोसिएशन बनाएं' : 'Mnemonic devices and associations - Create mnemonics and associations for remembering complex information',
                isHindi ? 'विज़ुअलाइजेशन तकनीक - दृश्य छवियों के माध्यम से अवधारणाओं को बेहतर ढंग से याद रखें' : 'Visualization techniques - Remember concepts better through visual imagery',
                isHindi ? 'अध्ययन के लिए माइंड मैपिंग - विचारों और अवधारणाओं को संगठित करने के लिए माइंड मैप्स बनाएं' : 'Mind mapping for studying - Create mind maps to organize ideas and concepts'
              ]}
            />
            
            <FeatureSection
              icon={<Brain className="h-6 w-6 text-teal-500" />}
              title={isHindi ? 'भाषा सीखने के उपकरण' : 'Language Learning Tools'}
              description={isHindi
                ? 'किसी भी नई भाषा को सीखने के लिए अभिनव और इंटरैक्टिव तरीकों का उपयोग करें।'
                : 'Use innovative and interactive methods to learn any new language.'}
              features={[
                isHindi ? 'इंटरैक्टिव वार्तालाप अभ्यास - विभिन्न परिदृश्यों में वार्तालाप का अभ्यास करें' : 'Interactive conversation practice - Practice conversations in various scenarios',
                isHindi ? 'सामग्री-आधारित भाषा सीखना - अपनी रुचि के विषयों पर पढ़कर और सुनकर भाषा सीखें' : 'Content-based language learning - Learn language by reading and listening about topics of your interest',
                isHindi ? 'व्याकरण और शब्दावली निर्माण - इंटरैक्टिव अभ्यासों के साथ व्याकरण और शब्दावली में सुधार करें' : 'Grammar and vocabulary building - Improve grammar and vocabulary with interactive exercises',
                isHindi ? 'उच्चारण प्रतिक्रिया - वास्तविक समय में अपने उच्चारण पर प्रतिक्रिया प्राप्त करें' : 'Pronunciation feedback - Get feedback on your pronunciation in real-time',
                isHindi ? 'भाषा प्रगति ट्रैकिंग - अपनी सीखने की यात्रा का विस्तृत विश्लेषण देखें' : 'Language progress tracking - See detailed analysis of your learning journey'
              ]}
            />
            
            <FeatureSection
              icon={<Target className="h-6 w-6 text-red-500" />}
              title={isHindi ? 'प्रेरणा और लक्ष्य प्रणाली' : 'Motivation & Goal System'}
              description={isHindi
                ? 'खुद को प्रेरित रखने और अपने अध्ययन लक्ष्यों को प्राप्त करने के लिए गेमिफाइड सिस्टम का उपयोग करें।'
                : 'Use a gamified system to keep yourself motivated and achieve your study goals.'}
              features={[
                isHindi ? 'अध्ययन स्ट्रीक और उपलब्धियां - अध्ययन करने के लिए प्रेरित रहने के लिए स्ट्रीक और बैज अर्जित करें' : 'Study streaks and achievements - Earn streaks and badges to stay motivated to study',
                isHindi ? 'अनुकूलित डेली चैलेंज - अपने व्यक्तिगत लक्ष्यों के आधार पर दैनिक अध्ययन चुनौतियाँ' : 'Personalized daily challenges - Daily study challenges based on your personal goals',
                isHindi ? 'प्रतिस्पर्धा और लीडरबोर्ड - दोस्तों के साथ स्वस्थ प्रतिस्पर्धा में शामिल हों' : 'Competition and leaderboards - Engage in healthy competition with friends',
                isHindi ? 'पुरस्कार और प्रोत्साहन - अध्ययन लक्ष्यों को पूरा करने पर वर्चुअल पुरस्कार अर्जित करें' : 'Rewards and incentives - Earn virtual rewards for completing study goals',
                isHindi ? 'प्रेरणादायक उद्धरण और अनुस्मारक - दैनिक प्रेरणादायक संदेश और अध्ययन अनुस्मारक प्राप्त करें' : 'Motivational quotes and reminders - Get daily motivational messages and study reminders'
              ]}
            />
          </TabsContent>
          
          {/* User Guide Tab */}
          <TabsContent value="guide" className="mt-6 space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
              <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
                {isHindi ? 'शुरू करें' : 'Getting Started'}
              </h2>
              
              <GuideSection 
                title={isHindi ? 'खाता बनाना' : 'Creating an Account'}
                steps={[
                  isHindi 
                    ? 'होमपेज पर "साइन अप" बटन पर क्लिक करें।' 
                    : 'Click on the "Sign Up" button on the homepage.',
                  isHindi 
                    ? 'अपना नाम, ईमेल और पासवर्ड दर्ज करें।' 
                    : 'Enter your name, email, and password.',
                  isHindi 
                    ? 'अपने खाते को सत्यापित करने के लिए अपने ईमेल पर भेजे गए लिंक पर क्लिक करें।' 
                    : 'Click on the link sent to your email to verify your account.',
                  isHindi 
                    ? 'अपनी शिक्षा स्तर और अध्ययन क्षेत्रों के बारे में जानकारी भरें।' 
                    : 'Fill in information about your education level and study areas.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'लॉग इन करना' : 'Logging In'}
                steps={[
                  isHindi 
                    ? 'होमपेज पर "लॉग इन" बटन पर क्लिक करें।' 
                    : 'Click on the "Log In" button on the homepage.',
                  isHindi 
                    ? 'अपना ईमेल और पासवर्ड दर्ज करें।' 
                    : 'Enter your email and password.',
                  isHindi 
                    ? '"लॉग इन" पर क्लिक करें।' 
                    : 'Click on "Log In".',
                  isHindi 
                    ? 'अपने अध्ययन डैशबोर्ड पर पहुंचें।' 
                    : 'Access your study dashboard.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'पासवर्ड रीसेट करना' : 'Resetting Password'}
                steps={[
                  isHindi 
                    ? 'लॉगिन पेज पर "पासवर्ड भूल गए?" लिंक पर क्लिक करें।' 
                    : 'Click on "Forgot Password?" link on the login page.',
                  isHindi 
                    ? 'अपना पंजीकृत ईमेल पता दर्ज करें।' 
                    : 'Enter your registered email address.',
                  isHindi 
                    ? '"रीसेट लिंक भेजें" पर क्लिक करें।' 
                    : 'Click on "Send Reset Link".',
                  isHindi 
                    ? 'अपने ईमेल पर भेजे गए लिंक पर क्लिक करें।' 
                    : 'Click on the link sent to your email.',
                  isHindi 
                    ? 'अपना नया पासवर्ड सेट करें और अपने खाते में लॉग इन करें।' 
                    : 'Set your new password and log into your account.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'पहली बार उपयोगकर्ताओं के लिए पूरी गाइड' : 'Complete Guide for First-Time Users'}
                steps={[
                  isHindi 
                    ? 'अपना खाता बनाएं और लॉग इन करें।' 
                    : 'Create your account and log in.',
                  isHindi 
                    ? 'अपनी प्रोफाइल सेटिंग्स में अपना शिक्षा स्तर और पसंदीदा विषय सेट करें।' 
                    : 'Set up your education level and preferred subjects in your profile settings.',
                  isHindi 
                    ? 'होमपेज पर AI चैट का अन्वेषण करें और अपना पहला प्रश्न पूछें।' 
                    : 'Explore the AI chat on the homepage and ask your first question.',
                  isHindi 
                    ? 'टूल्स सेक्शन में जाएं और उपलब्ध अध्ययन उपकरणों के बारे में जानें।' 
                    : 'Go to the tools section and learn about available study tools.',
                  isHindi 
                    ? 'अध्ययन आदतों के लिए अपने डैशबोर्ड पर अपनी प्रगति की निगरानी करें।' 
                    : 'Monitor your progress on your dashboard for your study habits.'
                ]}
              />
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-lg border border-purple-100 dark:border-purple-800">
              <h2 className="text-2xl font-semibold mb-4 text-purple-700 dark:text-purple-300">
                {isHindi ? 'प्रमुख सुविधाओं का उपयोग' : 'Using Key Features'}
              </h2>
              
              <GuideSection 
                title={isHindi ? 'AI चैट का उपयोग' : 'Using AI Chat'}
                steps={[
                  isHindi 
                    ? 'होम स्क्रीन पर दिए गए चैट इनपुट पर क्लिक करें।' 
                    : 'Click on the chat input provided on the home screen.',
                  isHindi 
                    ? 'अपना प्रश्न टाइप करें और एंटर दबाएं। आप माइक आइकन पर क्लिक करके बोलकर भी प्रश्न पूछ सकते हैं।' 
                    : 'Type your question and press enter. You can also ask questions by speaking by clicking on the mic icon.',
                  isHindi 
                    ? 'अपना संदेश संपादित करने या हटाने के लिए संदेश पर राइट-क्लिक करें।' 
                    : 'Right-click on a message to edit or delete it.',
                  isHindi 
                    ? 'महत्वपूर्ण जानकारी को सहेजने के लिए संदेश को बुकमार्क करें। बुकमार्क करने के लिए संदेश के ऊपर स्थित स्टार आइकन पर क्लिक करें।' 
                    : 'Bookmark messages to save important information. Click on the star icon located at the top of a message to bookmark it.',
                  isHindi 
                    ? 'चैट इतिहास देखने के लिए साइडबार में "इतिहास" पर क्लिक करें। यहां आप पिछली सभी बातचीत देख सकते हैं और उन्हें फिर से शुरू कर सकते हैं।' 
                    : 'Click on "History" in the sidebar to view chat history. Here you can view all previous conversations and resume them.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'नोट्स या अध्ययन योजना बनाना' : 'Creating Notes or Study Plan'}
                steps={[
                  isHindi 
                    ? '"स्टडी फीचर्स" टैब पर जाएं और "स्मार्ट नोट्स" या "अध्ययन योजना" पर क्लिक करें।' 
                    : 'Go to the "Study Features" tab and click on "Smart Notes" or "Study Plan".',
                  isHindi 
                    ? 'विषय, अध्याय, या परीक्षा विवरण जैसे आवश्यक फ़ील्ड भरें। आप जितनी अधिक विशिष्ट जानकारी प्रदान करेंगे, AI द्वारा उत्पन्न सामग्री उतनी ही बेहतर होगी।' 
                    : 'Fill in the required fields such as subject, chapter, or exam details. The more specific information you provide, the better the AI-generated content will be.',
                  isHindi 
                    ? '"जनरेट करें" बटन पर क्लिक करें और कुछ सेकंड प्रतीक्षा करें जबकि AI आपके लिए सामग्री तैयार करता है।' 
                    : 'Click on the "Generate" button and wait a few seconds while the AI prepares the content for you.',
                  isHindi 
                    ? 'नोट्स या अध्ययन योजना को संपादित, सहेजें या साझा करें। आप टेक्स्ट को कॉपी कर सकते हैं, PDF के रूप में सहेज सकते हैं, या सीधे अपने दोस्तों के साथ साझा कर सकते हैं।' 
                    : 'Edit, save, or share the notes or study plan. You can copy the text, save as PDF, or directly share with your friends.',
                  isHindi 
                    ? 'नोट्स देखने के लिए "सहेजे गए" सेक्शन पर जाएं। आप यहां अपने सभी सहेजे गए नोट्स और अध्ययन योजनाएं देख सकते हैं।' 
                    : 'Go to the "Saved" section to view your notes. You can see all your saved notes and study plans here.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'शिक्षक से संपर्क करना' : 'Contacting a Teacher'}
                steps={[
                  isHindi 
                    ? 'साइडबार में "शिक्षक से पूछें" पर क्लिक करें। यह विकल्प शिक्षक मोड में उपलब्ध है।' 
                    : 'Click on "Ask Teacher" in the sidebar. This option is available in Teacher Mode.',
                  isHindi 
                    ? 'विषय और अपना प्रश्न दर्ज करें। अपने प्रश्न को जितना संभव हो उतना स्पष्ट और विशिष्ट बनाएं।' 
                    : 'Enter the subject and your question. Make your question as clear and specific as possible.',
                  isHindi 
                    ? 'वैकल्पिक रूप से अपने प्रश्न से संबंधित फ़ाइलें अपलोड करें, जैसे छवियां, पीडीएफ, या अन्य दस्तावेज़।' 
                    : 'Optionally upload files related to your question, such as images, PDFs, or other documents.',
                  isHindi 
                    ? '"भेजें" बटन पर क्लिक करें। आपका प्रश्न उपलब्ध शिक्षकों को भेज दिया जाएगा।' 
                    : 'Click on the "Send" button. Your question will be sent to available teachers.',
                  isHindi 
                    ? 'शिक्षक का जवाब आने पर आपको एक सूचना मिलेगी। आप अपने सभी शिक्षक संवाद "शिक्षक चैट" अनुभाग में देख सकते हैं।' 
                    : 'You will get a notification when the teacher responds. You can view all your teacher conversations in the "Teacher Chat" section.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'अध्ययन टाइमर का उपयोग' : 'Using Study Timer'}
                steps={[
                  isHindi 
                    ? 'होम स्क्रीन पर "अध्ययन टाइमर" बटन पर क्लिक करें या साइडबार से टाइमर विकल्प चुनें।' 
                    : 'Click on "Study Timer" button on the home screen or select the timer option from the sidebar.',
                  isHindi 
                    ? 'अध्ययन और ब्रेक की अवधि सेट करें। आप पोमोडोरो सेटिंग्स (25 मिनट काम / 5 मिनट ब्रेक) का उपयोग कर सकते हैं या अपनी पसंद के अनुसार समय अनुकूलित कर सकते हैं।' 
                    : 'Set the study and break duration. You can use the pomodoro settings (25 min work / 5 min break) or customize the time according to your preference.',
                  isHindi 
                    ? '"शुरू करें" बटन पर क्लिक करके अध्ययन सत्र शुरू करें। टाइमर एक काउंटडाउन शुरू करेगा।' 
                    : 'Click on "Start" button to begin your study session. The timer will start a countdown.',
                  isHindi 
                    ? 'टाइमर समाप्त होने के बाद ब्रेक लें। एक अलार्म बजेगा जब अध्ययन सत्र समाप्त हो जाएगा और ब्रेक शुरू होगा।' 
                    : 'Take a break when the timer ends. An alarm will sound when the study session is over and break begins.',
                  isHindi 
                    ? 'अध्ययन सत्र पूरा होने पर, अपनी प्रगति देखें और XP अंक प्राप्त करें। आपके प्रत्येक पूर्ण अध्ययन सत्र के लिए आपको XP अंक मिलते हैं, जो आपको लीडरबोर्ड पर आगे बढ़ाते हैं।' 
                    : 'When the study session is complete, view your progress and earn XP points. You get XP points for each completed study session, which advance you on the leaderboard.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'क्विज़ का उपयोग करना' : 'Using the Quiz System'}
                steps={[
                  isHindi 
                    ? 'स्टडी टूल्स सेक्शन से "क्विज़ जनरेटर" पर क्लिक करें।' 
                    : 'Click on "Quiz Generator" from the Study Tools section.',
                  isHindi 
                    ? 'क्विज़ के लिए विषय, कठिनाई स्तर और प्रश्नों की संख्या चुनें।' 
                    : 'Choose the subject, difficulty level, and number of questions for the quiz.',
                  isHindi 
                    ? '"क्विज़ बनाएं" बटन पर क्लिक करें और प्रतीक्षा करें जबकि सिस्टम आपके लिए क्विज़ तैयार करता है।' 
                    : 'Click on "Generate Quiz" button and wait while the system prepares the quiz for you.',
                  isHindi 
                    ? 'क्विज़ के प्रश्नों के उत्तर दें। आप प्रश्न छोड़ सकते हैं और बाद में वापस आ सकते हैं।' 
                    : 'Answer the quiz questions. You can skip questions and come back to them later.',
                  isHindi 
                    ? 'क्विज़ समाप्त होने पर "जमा करें" पर क्लिक करें। आपको अपने परिणाम, सही उत्तर और विस्तृत व्याख्याएं दिखाई जाएंगी।' 
                    : 'Click on "Submit" when finished with the quiz. You will be shown your results, correct answers, and detailed explanations.'
                ]}
              />
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-6 rounded-lg border border-amber-100 dark:border-amber-800">
              <h2 className="text-2xl font-semibold mb-4 text-amber-700 dark:text-amber-300">
                {isHindi ? 'उपयोगकर्ता इंटरफ़ेस गाइड' : 'User Interface Guide'}
              </h2>
              
              <GuideSection 
                title={isHindi ? 'होम स्क्रीन नेविगेशन' : 'Home Screen Navigation'}
                steps={[
                  isHindi 
                    ? 'साइडबार: सभी प्रमुख विशेषताओं तक पहुंचने के लिए बाईं ओर का साइडबार उपयोग करें। मोबाइल पर, मेनू बटन पर क्लिक करके साइडबार खोलें।' 
                    : 'Sidebar: Use the left sidebar to access all main features. On mobile, open the sidebar by clicking the menu button.',
                  isHindi 
                    ? 'हेडर: प्रोफाइल, सेटिंग्स और सूचनाओं तक पहुंचने के लिए शीर्ष नेविगेशन बार का उपयोग करें।' 
                    : 'Header: Use the top navigation bar to access profile, settings, and notifications.',
                  isHindi 
                    ? 'चैट इंटरफ़ेस: स्क्रीन के मुख्य भाग पर चैट इंटरफ़ेस स्थित है, जहां आप AI के साथ बातचीत कर सकते हैं।' 
                    : 'Chat Interface: The chat interface is located on the main part of the screen, where you can interact with the AI.',
                  isHindi 
                    ? 'अध्ययन उपकरण: साइडबार से "अध्ययन उपकरण" अनुभाग तक पहुंचें या होम स्क्रीन पर दिखाए गए त्वरित लिंक का उपयोग करें।' 
                    : 'Study Tools: Access the "Study Tools" section from the sidebar or use the quick links displayed on the home screen.'
                ]}
              />
              
              <GuideSection 
                title={isHindi ? 'मोबाइल पर एप्लिकेशन का उपयोग' : 'Using the Application on Mobile'}
                steps={[
                  isHindi 
                    ? 'स्टडी AI को मोबाइल वेब ब्राउज़र पर एक्सेस करें या होमस्क्रीन पर ऐड करें।' 
                    : 'Access Study AI on mobile web browser or add to homescreen.',
                  isHindi 
                    ? 'नेविगेशन के लिए स्क्रीन के शीर्ष बाएँ कोने में मेनू आइकन पर टैप करें।' 
                    : 'Tap on the menu icon in the top left corner of the screen for navigation.',
                  isHindi 
                    ? 'इनपुट बार पर टैप करके चैट का उपयोग करें। आप माइक बटन का उपयोग करके वॉइस इनपुट भी दे सकते हैं।' 
                    : 'Use the chat by tapping on the input bar. You can also use voice input by using the mic button.',
                  isHindi 
                    ? 'लैंडस्केप मोड में फोन को घुमाकर किसी भी टूल का बड़ा व्यू प्राप्त करें।' 
                    : 'Rotate your phone to landscape mode for a larger view of any tool.',
                  isHindi 
                    ? 'ऑफलाइन उपयोग के लिए महत्वपूर्ण नोट्स या जानकारी सहेजें।' 
                    : 'Save important notes or information for offline use.'
                ]}
              />
            </div>
          </TabsContent>
          
          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-6 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                {isHindi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
              </h2>
              
              <div className="space-y-4">
                <FaqItem 
                  question={isHindi ? 'क्या स्टडी AI का उपयोग मुफ्त है?' : 'Is Study AI free to use?'}
                  answer={isHindi 
                    ? 'स्टडी AI के बुनियादी फीचर्स मुफ्त हैं। आप AI चैट, बेसिक नोट्स जनरेटर, और स्टडी टाइमर जैसी सुविधाओं का उपयोग बिना किसी शुल्क के कर सकते हैं। हालांकि, अतिरिक्त उन्नत सुविधाओं जैसे शिक्षक से संपर्क, उन्नत नोट्स और परीक्षा तैयारी सामग्री के लिए प्रीमियम सदस्यता उपलब्ध है।' 
                    : 'Basic features of Study AI are free. You can use AI chat, basic notes generator, and study timer features without any charge. However, premium subscriptions are available for additional advanced features like teacher contact, advanced notes, and exam preparation material.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या मैं अपने डिवाइस पर स्टडी AI का उपयोग कर सकता हूँ?' : 'Can I use Study AI on my device?'}
                  answer={isHindi 
                    ? 'हां, स्टडी AI वेब-आधारित है और किसी भी डिवाइस (मोबाइल, टैबलेट, लैपटॉप) पर वेब ब्राउज़र के माध्यम से एक्सेस किया जा सकता है। हमारा इंटरफेस रेस्पोंसिव है और स्मार्टफोन से लेकर डेस्कटॉप कंप्यूटर तक सभी स्क्रीन साइज़ के लिए ऑप्टिमाइज़ किया गया है। मोबाइल उपयोगकर्ताओं के लिए, आप अपने होम स्क्रीन पर ऐप जोड़ सकते हैं ताकि त्वरित पहुंच प्राप्त कर सकें।' 
                    : 'Yes, Study AI is web-based and can be accessed through a web browser on any device (mobile, tablet, laptop). Our interface is responsive and optimized for all screen sizes from smartphones to desktop computers. For mobile users, you can add the app to your home screen for quick access.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या मैं अपने अध्ययन सामग्री को सहेज सकता हूँ और बाद में एक्सेस कर सकता हूँ?' : 'Can I save my study materials and access them later?'}
                  answer={isHindi 
                    ? 'हां, आप अपनी सभी नोट्स, अध्ययन योजनाएं, और महत्वपूर्ण चैट सहेज सकते हैं और अपने खाते से कभी भी एक्सेस कर सकते हैं। आप PDF, TXT, या DOC फॉर्मेट में सामग्री डाउनलोड और निर्यात भी कर सकते हैं। इसके अलावा, बुकमार्क फीचर आपको महत्वपूर्ण जानकारी को तुरंत एक्सेस करने की अनुमति देता है। आपका सभी सहेजा गया डेटा क्लाउड पर सुरक्षित रूप से स्टोर किया जाता है।' 
                    : 'Yes, you can save all your notes, study plans, and important chats and access them anytime from your account. You can also download and export content in PDF, TXT, or DOC formats. Additionally, the bookmark feature allows you to instantly access important information. All your saved data is securely stored on the cloud.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'स्टडी AI कितनी भाषाओं का समर्थन करता है?' : 'How many languages does Study AI support?'}
                  answer={isHindi 
                    ? 'स्टडी AI वर्तमान में अंग्रेजी और हिंदी का समर्थन करता है। ये भाषाएँ यूजर इंटरफेस और AI उत्तरों दोनों में उपलब्ध हैं। आप अपनी भाषा प्राथमिकता अपने उपयोगकर्ता प्रोफ़ाइल में या ऐप के किसी भी पेज पर भाषा स्विचर का उपयोग करके सेट कर सकते हैं। भविष्य में अधिक भाषाएँ जोड़ी जाएंगी।' 
                    : 'Study AI currently supports English and Hindi. These languages are available for both user interface and AI responses. You can set your language preference in your user profile or by using the language switcher on any page of the app. More languages will be added in the future.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या मैं अपने अध्ययन की प्रगति को ट्रैक कर सकता हूँ?' : 'Can I track my study progress?'}
                  answer={isHindi 
                    ? 'हां, स्टडी AI आपके अध्ययन सत्रों, लक्ष्य पूर्णता, और सीखने की प्रगति को ट्रैक करता है और विश्लेषण प्रदान करता है। प्रगति डैशबोर्ड आपके अध्ययन समय, लक्ष्य पूर्ति दर, और सीखने के रुझानों के बारे में विस्तृत जानकारी प्रदर्शित करता है। आप दैनिक, साप्ताहिक, और मासिक रिपोर्ट देख सकते हैं। अधिकतम लाभ के लिए, सभी अध्ययन सत्रों के लिए अध्ययन टाइमर का उपयोग करें और अपने लक्ष्यों को सेट करें।' 
                    : 'Yes, Study AI tracks your study sessions, goal completions, and learning progress, providing analytics. The progress dashboard displays detailed information about your study time, goal completion rate, and learning trends. You can view daily, weekly, and monthly reports. For maximum benefit, use the study timer for all study sessions and set your goals.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या मुझे अपने खाते में लॉग इन करना होगा?' : 'Do I need to be logged in to my account?'}
                  answer={isHindi 
                    ? 'कुछ बुनियादी सुविधाओं का उपयोग लॉगिन के बिना किया जा सकता है, लेकिन व्यक्तिगत अनुभव और सहेजने के लिए लॉग इन की आवश्यकता होती है। लॉगिन उपयोगकर्ताओं को अपनी प्रगति ट्रैक करने, अपनी सामग्री सहेजने, और व्यक्तिगत अध्ययन योजनाओं का उपयोग करने की अनुमति देता है। इसके अलावा, प्रीमियम सुविधाओं तक पहुँच के लिए एक खाता आवश्यक है। सुरक्षा उद्देश्यों के लिए, 30 मिनट की निष्क्रियता के बाद आप स्वचालित रूप से लॉगआउट हो जाएंगे।' 
                    : 'Some basic features can be used without logging in, but personalized experience and saving features require login. Logged-in users can track their progress, save their content, and use personalized study plans. Additionally, an account is required for access to premium features. For security purposes, you will be automatically logged out after 30 minutes of inactivity.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या स्टडी AI सभी शैक्षिक स्तरों के लिए उपयुक्त है?' : 'Is Study AI suitable for all academic levels?'}
                  answer={isHindi 
                    ? 'हां, स्टडी AI प्राथमिक स्कूल से लेकर विश्वविद्यालय और व्यावसायिक शिक्षा तक सभी स्तरों के छात्रों के लिए डिज़ाइन किया गया है। हमारा AI सिस्टम उपयोगकर्ता के शैक्षिक स्तर के अनुसार अपने उत्तरों और सामग्री को अनुकूलित करता है। प्राथमिक छात्रों के लिए सरल भाषा और आसान स्पष्टीकरण से लेकर उन्नत छात्रों के लिए अधिक तकनीकी और गहन विश्लेषण तक, स्टडी AI सभी उम्र और शिक्षा स्तरों के छात्रों की जरूरतों को पूरा करता है।' 
                    : 'Yes, Study AI is designed for students of all levels from primary school to university and professional education. Our AI system customizes its answers and content according to the user\'s educational level. From simple language and easy explanations for primary students to more technical and in-depth analysis for advanced students, Study AI caters to the needs of students of all ages and education levels.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या मैं शिक्षक मोड में वास्तविक शिक्षकों से बातचीत कर सकता हूँ?' : 'Can I interact with real teachers in Teacher Mode?'}
                  answer={isHindi 
                    ? 'हां, शिक्षक मोड आपको प्रमाणित शिक्षकों और विषय विशेषज्ञों से जोड़ता है जो आपके प्रश्नों और असाइनमेंट में मदद कर सकते हैं। यह सुविधा प्रीमियम उपयोगकर्ताओं के लिए उपलब्ध है और विशेष परिस्थितियों में मुफ्त उपयोगकर्ताओं को सीमित एक्सेस प्रदान की जाती है। शिक्षक कार्य दिवसों में 24 घंटे के भीतर प्रतिक्रिया देते हैं और तत्काल सहायता के लिए लाइव सत्र भी अनुसूचित कर सकते हैं।' 
                    : 'Yes, Teacher Mode connects you with certified teachers and subject experts who can help with your questions and assignments. This feature is available for premium users and limited access is provided to free users in special circumstances. Teachers respond within 24 hours on working days and can also schedule live sessions for immediate assistance.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या AI उत्तर हमेशा सटीक होते हैं?' : 'Are AI answers always accurate?'}
                  answer={isHindi 
                    ? 'स्टडी AI अत्यधिक सटीक उत्तर प्रदान करने के लिए डिज़ाइन किया गया है, लेकिन किसी भी AI सिस्टम की तरह, यह हमेशा 100% सटीक नहीं हो सकता है। हम नियमित रूप से अपने मॉडल को अपडेट करते हैं और सटीकता सुनिश्चित करने के लिए विशेषज्ञों के साथ काम करते हैं। अगर आपको कोई त्रुटि मिलती है, तो कृपया फीडबैक बटन का उपयोग करके हमें सूचित करें। जटिल या महत्वपूर्ण विषयों के लिए, हम अतिरिक्त स्रोतों से जानकारी की पुष्टि करने की सलाह देते हैं।' 
                    : 'Study AI is designed to provide highly accurate answers, but like any AI system, it may not always be 100% accurate. We regularly update our model and work with experts to ensure accuracy. If you find any error, please inform us using the feedback button. For complex or critical subjects, we recommend verifying information with additional sources.'}
                />
                
                <FaqItem 
                  question={isHindi ? 'क्या स्टडी AI का उपयोग परीक्षा के दौरान किया जा सकता है?' : 'Can Study AI be used during exams?'}
                  answer={isHindi 
                    ? 'स्टडी AI परीक्षा की तैयारी के लिए एक उत्कृष्ट उपकरण है, लेकिन परीक्षा के दौरान इसका उपयोग आपके शैक्षिक संस्थान की नीतियों के अनुसार अनुमति या प्रतिबंधित हो सकता है। हम सभी उपयोगकर्ताओं को अपने संस्थान के शैक्षिक ईमानदारी नियमों का पालन करने और स्टडी AI का उपयोग सीखने और तैयारी के उपकरण के रूप में करने की सलाह देते हैं, न कि परीक्षाओं में अनुचित लाभ प्राप्त करने के लिए।' 
                    : 'Study AI is an excellent tool for exam preparation, but its use during exams may be permitted or restricted according to your educational institution\'s policies. We advise all users to follow their institution\'s academic integrity rules and use Study AI as a learning and preparation tool, not to gain unfair advantage in examinations.'}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 rounded-lg border border-purple-100 dark:border-purple-800">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-purple-800 dark:text-purple-300">
                <Phone className="h-5 w-5" />
                {isHindi ? 'संपर्क जानकारी' : 'Contact Information'}
              </h2>
              
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900">
                  <h3 className="text-xl font-bold mb-3 text-purple-700 dark:text-purple-300">
                    {isHindi ? 'निर्माता' : 'Created By'}
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                      AK
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Ajit Kumar
                      </p>
                      <p className="mt-2 text-purple-600 dark:text-purple-400 font-medium">
                        {isHindi ? 'मोबाइल:' : 'Mobile:'} 9504797910
                      </p>
                      <p className="text-purple-600 dark:text-purple-400 font-medium">
                        {isHindi ? 'ईमेल:' : 'Email:'} ajit91884270@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900">
                    <h3 className="text-lg font-medium mb-3 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {isHindi ? 'सहायता और समर्थन' : 'Help & Support'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {isHindi 
                        ? 'किसी भी प्रश्न या सहायता के लिए, हमें ईमेल करें:' 
                        : 'For any questions or assistance, email us at:'}
                    </p>
                    <p className="mt-2 font-medium text-purple-600 dark:text-purple-400">
                      ajit91884270@gmail.com
                    </p>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {isHindi 
                        ? 'हम आमतौर पर 24 घंटे के भीतर जवाब देते हैं।' 
                        : 'We typically respond within 24 hours.'}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900">
                    <h3 className="text-lg font-medium mb-3 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      {isHindi ? 'प्रतिक्रिया दें' : 'Give Feedback'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {isHindi 
                        ? 'हमें अपनी प्रतिक्रिया दें और हमें अपना अनुभव बेहतर बनाने में मदद करें:' 
                        : 'Share your feedback and help us improve your experience:'}
                    </p>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {isHindi 
                        ? 'साइडबार में "प्रतिक्रिया दें" बटन पर क्लिक करें।' 
                        : 'Click on "Give Feedback" button in the sidebar.'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900">
                  <h3 className="text-lg font-medium mb-3 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {isHindi ? 'त्वरित संपर्क फॉर्म' : 'Quick Contact Form'}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {isHindi 
                      ? 'नीचे दिए गए फॉर्म के माध्यम से हमसे तुरंत संपर्क करें:' 
                      : 'Contact us immediately through the form below:'}
                  </p>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isHindi ? 'आपका नाम' : 'Your Name'}
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isHindi ? 'आपका ईमेल' : 'Your Email'}
                        </label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isHindi ? 'विषय' : 'Subject'}
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isHindi ? 'संदेश' : 'Message'}
                      </label>
                      <textarea 
                        rows={4}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      ></textarea>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      {isHindi ? 'भेजें' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

// Helper Components

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="font-semibold text-lg mb-1">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
  </div>
);

const FeatureSection = ({ 
  icon, 
  title, 
  description, 
  features 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  features: string[] 
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex items-center justify-center shrink-0">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const GuideSection = ({ title, steps }: { title: string, steps: string[] }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <ol className="space-y-2 ml-5 text-gray-700 dark:text-gray-300">
      {steps.map((step, index) => (
        <li key={index} className="list-decimal">
          {step}
        </li>
      ))}
    </ol>
  </div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => (
  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
    <h3 className="font-semibold text-lg mb-2 text-purple-700 dark:text-purple-300">{question}</h3>
    <p className="text-gray-700 dark:text-gray-300">{answer}</p>
  </div>
);

export default About;
