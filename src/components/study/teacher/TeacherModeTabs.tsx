
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
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <InteractiveTeacherHistory />
      </div>
      <InteractiveTeacherSetup
        onStartLesson={handleStartInteractiveLesson}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default TeacherModeTabs;
