
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import ClassicTeacherForm from './ClassicTeacherForm';
import QuickActions from './QuickActions';
import InteractiveTeacherSetup from '../interactive-teacher/InteractiveTeacherSetup';
import InteractiveTeacherHistory from '../interactive-teacher/InteractiveTeacherHistory';
import { useInteractiveTeacher } from '@/hooks/interactive-teacher';

interface TeacherModeTabsProps {
  onSendMessage: (message: string) => void;
  useVoiceResponse: boolean;
  setUseVoiceResponse: (value: boolean) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (value: string) => void;
  learningMode: string;
  setLearningMode: (value: string) => void;
}

const TeacherModeTabs: React.FC<TeacherModeTabsProps> = ({
  onSendMessage,
  useVoiceResponse,
  setUseVoiceResponse,
  selectedDifficulty,
  setSelectedDifficulty,
  learningMode,
  setLearningMode
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { startLesson, isProcessing } = useInteractiveTeacher();

  const handleStartInteractiveLesson = (prompt: string, context: any) => {
    // Generate session ID and navigate to new page
    const sessionId = `session_${Date.now()}`;
    
    // Store lesson data in sessionStorage for the new page
    sessionStorage.setItem(`lesson_${sessionId}`, JSON.stringify({
      prompt,
      context
    }));

    // Navigate to new page using React Router
    navigate(`/interactive-teacher/${sessionId}`);
  };

  return (
    <Tabs defaultValue="classic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="classic" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {language === 'hi' ? 'क्लासिक मोड' : 'Classic Mode'}
        </TabsTrigger>
        <TabsTrigger value="interactive" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {language === 'hi' ? 'Live Teaching' : 'Live Teaching'}
          <Badge className="ml-1 bg-green-500 text-white px-2 py-0.5 text-xs">
            {language === 'hi' ? 'नया' : 'New'}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="interactive" className="mt-6">
        <div className="flex justify-end mb-4">
          <InteractiveTeacherHistory />
        </div>
        <InteractiveTeacherSetup
          onStartLesson={handleStartInteractiveLesson}
          isProcessing={isProcessing}
        />
      </TabsContent>

      <TabsContent value="classic" className="mt-6">
        <QuickActions 
          useVoiceResponse={useVoiceResponse}
          setUseVoiceResponse={setUseVoiceResponse}
          onSendMessage={onSendMessage}
        />

        <ClassicTeacherForm
          onSendMessage={onSendMessage}
          useVoiceResponse={useVoiceResponse}
          setUseVoiceResponse={setUseVoiceResponse}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          learningMode={learningMode}
          setLearningMode={setLearningMode}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TeacherModeTabs;
