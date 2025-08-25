
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Trophy, Star, Flame, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface MotivationSystemProps {
  onSendMessage: (message: string) => void;
}

const MotivationSystem: React.FC<MotivationSystemProps> = ({ onSendMessage }) => {
  const { t, language } = useLanguage();

  const getMotivationalPrompts = () => {
    if (language === 'en') {
      return [
        {
          icon: <Trophy className="h-5 w-5 text-amber-500" />,
          title: t('studyMotivation'),
          description: t('motivationDescription1'),
          prompt: "I'm feeling unmotivated to study. Can you give me personalized motivation and strategies to stay focused and productive? Include some inspirational quotes and practical tips."
        },
        {
          icon: <Target className="h-5 w-5 text-red-500" />,
          title: t('examPreparation'),
          description: t('motivationDescription2'),
          prompt: "I have an important exam coming up and I'm feeling anxious. Can you provide me with mental preparation strategies, anxiety management techniques, and a last-minute study plan to boost my confidence?"
        },
        {
          icon: <Flame className="h-5 w-5 text-orange-500" />,
          title: t('overcomeProcrastination'),
          description: t('motivationDescription3'),
          prompt: "I keep procrastinating on my studies. Can you help me understand why I might be procrastinating and suggest effective techniques to overcome it?"
        },
        {
          icon: <Star className="h-5 w-5 text-purple-500" />,
          title: t('dailyAffirmations'),
          description: t('motivationDescription4'),
          prompt: "Can you create a set of daily positive affirmations specifically for students to boost confidence and maintain focus on academic goals?"
        },
        {
          icon: <Zap className="h-5 w-5 text-yellow-500" />,
          title: t('studyEnergyBoost'),
          description: t('motivationDescription5'),
          prompt: "I'm feeling mentally exhausted from studying. Can you suggest some quick mental and physical exercises to regain energy and focus without taking a long break?"
        }
      ];
    } else {
      return [
        {
          icon: <Trophy className="h-5 w-5 text-amber-500" />,
          title: t('studyMotivation'),
          description: t('motivationDescription1'),
          prompt: "मैं पढ़ाई के लिए प्रेरणाहीन महसूस कर रहा हूँ। क्या आप मुझे ध्यान केंद्रित और उत्पादक रहने के लिए व्यक्तिगत प्रेरणा और रणनीतियाँ दे सकते हैं? कुछ प्रेरणादायक उद्धरण और व्यावहारिक सुझाव शामिल करें।"
        },
        {
          icon: <Target className="h-5 w-5 text-red-500" />,
          title: t('examPreparation'),
          description: t('motivationDescription2'),
          prompt: "मेरी एक महत्वपूर्ण परीक्षा आ रही है और मैं चिंतित महसूस कर रहा हूँ। क्या आप मुझे मानसिक तैयारी की रणनीतियाँ, चिंता प्रबंधन तकनीकें, और मेरे आत्मविश्वास को बढ़ावा देने के लिए अंतिम-मिनट का अध्ययन योजना प्रदान कर सकते हैं?"
        },
        {
          icon: <Flame className="h-5 w-5 text-orange-500" />,
          title: t('overcomeProcrastination'),
          description: t('motivationDescription3'),
          prompt: "मैं अपनी पढ़ाई पर टालमटोल करता रहता हूँ। क्या आप मुझे समझने में मदद कर सकते हैं कि मैं टालमटोल क्यों कर रहा हो सकता हूँ और इससे पार पाने के लिए प्रभावी तकनीकें सुझा सकते हैं?"
        },
        {
          icon: <Star className="h-5 w-5 text-purple-500" />,
          title: t('dailyAffirmations'),
          description: t('motivationDescription4'),
          prompt: "क्या आप विशेष रूप से छात्रों के लिए आत्मविश्वास को बढ़ावा देने और शैक्षिक लक्ष्यों पर ध्यान बनाए रखने के लिए दैनिक सकारात्मक पुष्टिकरणों का एक सेट बना सकते हैं?"
        },
        {
          icon: <Zap className="h-5 w-5 text-yellow-500" />,
          title: t('studyEnergyBoost'),
          description: t('motivationDescription5'),
          prompt: "मैं पढ़ाई से मानसिक रूप से थका हुआ महसूस कर रहा हूँ। क्या आप लंबा ब्रेक लिए बिना ऊर्जा और फोकस वापस पाने के लिए कुछ त्वरित मानसिक और शारीरिक व्यायाम सुझा सकते हैं?"
        }
      ];
    }
  };

  const motivationalPrompts = getMotivationalPrompts();

  const handleSendMotivation = (prompt: string) => {
    onSendMessage(prompt);
    toast.success(language === 'en' ? 'Getting motivation tips...' : 'प्रेरणा युक्तियाँ प्राप्त कर रहे हैं...');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          {t('motivationSystem')}
        </CardTitle>
        <CardDescription>
          {t('motivationDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
          {motivationalPrompts.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex flex-col items-center justify-start p-4 border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
              onClick={() => handleSendMotivation(item.prompt)}
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-2">
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.title}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                {item.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MotivationSystem;
