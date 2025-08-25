
import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LearningPreferencesProps {
  selectedDifficulty: string;
  setSelectedDifficulty: (value: string) => void;
  learningMode: string;
  setLearningMode: (value: string) => void;
}

const LearningPreferences: React.FC<LearningPreferencesProps> = ({
  selectedDifficulty,
  setSelectedDifficulty,
  learningMode,
  setLearningMode
}) => {
  const { language } = useLanguage();

  const difficultyLevels = [
    { 
      value: 'beginner', 
      label: language === 'en' ? 'Beginner' : 'शुरुआती',
      icon: '🌱',
      color: 'bg-green-500'
    },
    { 
      value: 'medium', 
      label: language === 'en' ? 'Intermediate' : 'मध्यम',
      icon: '📚',
      color: 'bg-yellow-500'
    },
    { 
      value: 'advanced', 
      label: language === 'en' ? 'Advanced' : 'उन्नत',
      icon: '🎓',
      color: 'bg-red-500'
    }
  ];

  const learningModes = [
    { 
      value: 'interactive', 
      label: language === 'en' ? 'Interactive' : 'इंटरैक्टिव',
      icon: '🤝',
      description: language === 'en' ? 'Q&A based learning' : 'प्रश्न-उत्तर आधारित सीखना'
    },
    { 
      value: 'storytelling', 
      label: language === 'en' ? 'Story Mode' : 'कहानी मोड',
      icon: '📖',
      description: language === 'en' ? 'Learn through stories' : 'कहानियों के माध्यम से सीखें'
    },
    { 
      value: 'practical', 
      label: language === 'en' ? 'Practical' : 'व्यावहारिक',
      icon: '🔬',
      description: language === 'en' ? 'Hands-on examples' : 'व्यावहारिक उदाहरण'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold flex items-center gap-2">
        <Target className="h-5 w-5 text-orange-500" />
        {language === 'en' ? 'Learning Preferences' : 'सीखने की प्राथमिकताएं'}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-3">
          <label className="font-medium text-sm">{language === 'en' ? 'Difficulty Level' : 'कठिनाई स्तर'}</label>
          <div className="space-y-2">
            {difficultyLevels.map((level) => (
              <motion.button
                key={level.value}
                type="button"
                onClick={() => setSelectedDifficulty(level.value)}
                className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  selectedDifficulty === level.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                <span className="text-lg">{level.icon}</span>
                <span className="font-medium">{level.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="font-medium text-sm">{language === 'en' ? 'Learning Mode' : 'सीखने का तरीका'}</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {learningModes.map((mode) => (
              <motion.button
                key={mode.value}
                type="button"
                onClick={() => setLearningMode(mode.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  learningMode === mode.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-2xl mb-2">{mode.icon}</div>
                <h5 className="font-semibold text-sm mb-1">{mode.label}</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">{mode.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPreferences;
