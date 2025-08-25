
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, MessageSquare, Hand } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentQuestionProps {
  isListening: boolean;
  toggleListening: () => void;
  sendStudentQuestion: () => void;
}

const StudentQuestion: React.FC<StudentQuestionProps> = ({ 
  isListening, 
  toggleListening, 
  sendStudentQuestion 
}) => {
  const { language } = useLanguage();
  
  return (
    <div className="mt-6 border-t border-purple-100 dark:border-purple-800 pt-4 relative">
      {/* Decorative classroom elements */}
      <div className="absolute -top-2 left-4 w-6 h-6 bg-yellow-200 dark:bg-yellow-700 rounded-full opacity-50"></div>
      <div className="absolute -top-2 right-4 w-6 h-6 bg-blue-200 dark:bg-blue-700 rounded-full opacity-50"></div>
      
      <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center">
        <Hand className="h-4 w-4 mr-1 animate-bounce" />
        {language === 'hi' ? 'अपने शिक्षक से पूछें' : 'Ask Your Teacher'}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {language === 'hi' ? 'अपना प्रश्न पूछें जैसे आप कक्षा में हाथ उठा रहे हों' : 'Raise your hand with a question like in a real classroom'}
      </p>
      
      <div className="flex gap-2">
        <Input
          id="student-question"
          placeholder={language === 'hi' ? "शिक्षक जी, मुझे यह समझ नहीं आया..." : "Teacher, I don't understand..."}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={toggleListening}
          className={`${isListening ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 animate-pulse' : ''}`}
          title={language === 'hi' ? "अपना प्रश्न बोलें" : "Speak your question"}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </Button>
        <Button
          type="button"
          onClick={sendStudentQuestion}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 relative overflow-hidden group"
          title={language === 'hi' ? "हाथ उठाएं" : "Raise hand"}
        >
          <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white rounded-full group-hover:w-32 group-hover:h-32 opacity-10"></span>
          <Hand size={16} className="mr-1 transition-transform group-hover:scale-110" />
          {language === 'hi' ? "पूछें" : "Ask"}
        </Button>
      </div>
    </div>
  );
};

export default StudentQuestion;
