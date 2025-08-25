
import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Book, PenTool } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubmitButtonProps {
  isProcessing: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isProcessing }) => {
  const { t } = useLanguage();
  
  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 relative group overflow-hidden"
      disabled={isProcessing}
    >
      {/* Animated background effect */}
      <span className="absolute inset-0 w-full h-full transition-all duration-300 scale-x-0 translate-x-0 bg-white/10 group-hover:scale-x-100 group-hover:translate-x-full ease-out origin-left"></span>
      
      {isProcessing ? (
        <span className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
          {t('processing')}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <div className="relative">
            <GraduationCap className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-yellow-300 rounded-full animate-ping opacity-70"></span>
          </div>
          {t('generateTeaching')}
        </span>
      )}
    </Button>
  );
};

export default SubmitButton;
