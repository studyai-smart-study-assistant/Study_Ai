
import React from 'react';
import { Card } from '@/components/ui/card';
import { Brain, MessageSquare, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const EnhancedFeatures: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow">
        <Brain className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
        <h5 className="font-semibold text-emerald-800 dark:text-emerald-200">
          {language === 'en' ? 'Adaptive Learning' : 'अनुकूलित सीखना'}
        </h5>
        <p className="text-sm text-emerald-600 dark:text-emerald-300">
          {language === 'en' ? 'AI adjusts to your pace' : 'AI आपकी गति के अनुसार समायोजित करता है'}
        </p>
      </Card>

      <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
        <h5 className="font-semibold text-blue-800 dark:text-blue-200">
          {language === 'en' ? 'Interactive Q&A' : 'इंटरैक्टिव प्रश्न-उत्तर'}
        </h5>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          {language === 'en' ? 'Ask questions anytime' : 'कभी भी प्रश्न पूछें'}
        </p>
      </Card>

      <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
        <Star className="h-8 w-8 mx-auto mb-2 text-purple-600" />
        <h5 className="font-semibold text-purple-800 dark:text-purple-200">
          {language === 'en' ? 'Personalized Content' : 'व्यक्तिगत सामग्री'}
        </h5>
        <p className="text-sm text-purple-600 dark:text-purple-300">
          {language === 'en' ? 'Tailored to your level' : 'आपके स्तर के अनुकूल'}
        </p>
      </Card>
    </div>
  );
};

export default EnhancedFeatures;
