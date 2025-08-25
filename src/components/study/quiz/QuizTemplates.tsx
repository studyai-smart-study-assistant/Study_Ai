
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Calculator, Microscope, Globe, Cpu, Palette } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizTemplate {
  id: string;
  name: string;
  subject: string;
  difficulty: string;
  questions: number;
  icon: React.ReactNode;
  description: string;
  topic: string;
}

interface QuizTemplatesProps {
  onSelectTemplate: (template: QuizTemplate) => void;
}

const QuizTemplates: React.FC<QuizTemplatesProps> = ({ onSelectTemplate }) => {
  const { language } = useLanguage();

  const templates: QuizTemplate[] = [
    {
      id: 'math-basic',
      name: language === 'en' ? 'Basic Mathematics' : 'बुनियादी गणित',
      subject: 'mathematics',
      difficulty: 'easy',
      questions: 10,
      icon: <Calculator className="h-5 w-5" />,
      description: language === 'en' ? 'Addition, subtraction, multiplication' : 'जोड़, घटाव, गुणा',
      topic: language === 'en' ? 'Basic arithmetic operations' : 'बुनियादी अंकगणित'
    },
    {
      id: 'science-general',
      name: language === 'en' ? 'General Science' : 'सामान्य विज्ञान',
      subject: 'science',
      difficulty: 'medium',
      questions: 15,
      icon: <Microscope className="h-5 w-5" />,
      description: language === 'en' ? 'Physics, Chemistry, Biology basics' : 'भौतिकी, रसायन, जीव विज्ञान',
      topic: language === 'en' ? 'Basic science concepts' : 'बुनियादी विज्ञान अवधारणाएं'
    },
    {
      id: 'geography-world',
      name: language === 'en' ? 'World Geography' : 'विश्व भूगोल',
      subject: 'geography',
      difficulty: 'medium',
      questions: 12,
      icon: <Globe className="h-5 w-5" />,
      description: language === 'en' ? 'Countries, capitals, landmarks' : 'देश, राजधानी, स्थल',
      topic: language === 'en' ? 'World geography and landmarks' : 'विश्व भूगोल और स्थल'
    },
    {
      id: 'computer-basics',
      name: language === 'en' ? 'Computer Basics' : 'कंप्यूटर बेसिक्स',
      subject: 'computer',
      difficulty: 'easy',
      questions: 8,
      icon: <Cpu className="h-5 w-5" />,
      description: language === 'en' ? 'Hardware, software, internet' : 'हार्डवेयर, सॉफ्टवेयर, इंटरनेट',
      topic: language === 'en' ? 'Computer fundamentals' : 'कंप्यूटर की बुनियादी बातें'
    },
    {
      id: 'literature-classic',
      name: language === 'en' ? 'Classic Literature' : 'क्लासिक साहित्य',
      subject: 'literature',
      difficulty: 'hard',
      questions: 10,
      icon: <BookOpen className="h-5 w-5" />,
      description: language === 'en' ? 'Famous authors and works' : 'प्रसिद्ध लेखक और कार्य',
      topic: language === 'en' ? 'Classic literature and authors' : 'क्लासिक साहित्य और लेखक'
    },
    {
      id: 'art-history',
      name: language === 'en' ? 'Art History' : 'कला इतिहास',
      subject: 'general',
      difficulty: 'medium',
      questions: 12,
      icon: <Palette className="h-5 w-5" />,
      description: language === 'en' ? 'Famous artists and movements' : 'प्रसिद्ध कलाकार और आंदोलन',
      topic: language === 'en' ? 'Art history and famous artists' : 'कला इतिहास और प्रसिद्ध कलाकार'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
        {language === 'en' ? '🎯 Quick Start Templates' : '🎯 त्वरित शुरुआत टेम्प्लेट'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-md transition-all cursor-pointer border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600"
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-sm">{template.name}</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {template.questions} {language === 'en' ? 'questions' : 'प्रश्न'}
                </span>
                <span className={`px-2 py-1 rounded ${
                  template.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  template.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {template.difficulty === 'easy' ? (language === 'en' ? 'Easy' : 'आसान') :
                   template.difficulty === 'medium' ? (language === 'en' ? 'Medium' : 'मध्यम') :
                   (language === 'en' ? 'Hard' : 'कठिन')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizTemplates;
