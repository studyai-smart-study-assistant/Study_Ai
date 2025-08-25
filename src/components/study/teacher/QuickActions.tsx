
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Headphones, Mic, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsProps {
  useVoiceResponse: boolean;
  setUseVoiceResponse: (value: boolean) => void;
  onSendMessage: (message: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  useVoiceResponse, 
  setUseVoiceResponse, 
  onSendMessage 
}) => {
  const { language } = useLanguage();

  const quickActions = [
    {
      label: language === 'en' ? 'Ask Doubt' : 'संदेह पूछें',
      icon: MessageSquare,
      action: () => {
        const input = document.getElementById('student-question') as HTMLInputElement;
        if (input) input.focus();
      }
    },
    {
      label: language === 'en' ? 'Voice Mode' : 'आवाज मोड',
      icon: useVoiceResponse ? Headphones : Mic,
      action: () => setUseVoiceResponse(!useVoiceResponse)
    },
    {
      label: language === 'en' ? 'Quick Review' : 'त्वरित समीक्षा',
      icon: Zap,
      action: () => {
        const reviewPrompt = language === 'en' 
          ? 'Give me a quick 2-minute review of the key points we just covered'
          : 'हमने अभी जो मुख्य बिंदु कवर किए हैं, उनकी 2-मिनट की त्वरित समीक्षा दें';
        onSendMessage(reviewPrompt);
      }
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-3 gap-3"
    >
      {quickActions.map((action, index) => (
        <motion.button
          key={index}
          onClick={action.action}
          className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-md hover:shadow-lg group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <action.icon className="h-6 w-6 mx-auto mb-2 text-purple-600 group-hover:text-purple-700 transition-colors" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
