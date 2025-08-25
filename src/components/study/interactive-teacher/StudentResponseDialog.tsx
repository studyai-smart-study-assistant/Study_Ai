
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, GraduationCap, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeacherMessage {
  id: string;
  content: string;
  isQuestion: boolean;
  awaitingResponse?: boolean;
  timestamp: number;
}

interface StudentResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: TeacherMessage[];
  onSubmitAnswer: (answer: string) => void;
  isProcessing: boolean;
}

const StudentResponseDialog: React.FC<StudentResponseDialogProps> = ({
  open,
  onOpenChange,
  messages,
  onSubmitAnswer,
  isProcessing
}) => {
  const { language } = useLanguage();
  const [studentAnswer, setStudentAnswer] = useState('');

  const getCurrentQuestion = () => {
    return messages.filter(msg => msg.isQuestion).pop()?.content || '';
  };

  const handleSubmitAnswer = () => {
    if (studentAnswer.trim()) {
      onSubmitAnswer(studentAnswer);
      setStudentAnswer('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setStudentAnswer('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            {language === 'hi' ? 'शिक्षक का प्रश्न' : "Teacher's Question"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {language === 'hi' ? 'शिक्षक कह रहे हैं:' : 'Teacher is asking:'}
              </p>
            </div>
            <p className="text-sm whitespace-pre-wrap pl-6 leading-relaxed">{getCurrentQuestion()}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <label className="text-sm font-medium">
                {language === 'hi' ? 'आपका जवाब:' : 'Your Answer:'}
              </label>
            </div>
            <Textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder={language === 'hi' 
                ? "यहाँ अपना जवाब लिखें... गलत हो तो भी कोई बात नहीं, शिक्षक आपको सिखाएंगे!" 
                : "Type your answer here... It's okay if it's wrong, the teacher will help you learn!"}
              className="min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
            />
            <p className="text-xs text-gray-500">
              {language === 'hi' 
                ? 'टिप: Enter दबाएं भेजने के लिए, Shift+Enter नई लाइन के लिए'
                : 'Tip: Press Enter to send, Shift+Enter for new line'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={!studentAnswer.trim() || isProcessing}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-1" />
              {language === 'hi' ? 'जवाब भेजें' : 'Submit Answer'}
            </Button>
            <Button 
              onClick={handleClose} 
              variant="outline"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentResponseDialog;
