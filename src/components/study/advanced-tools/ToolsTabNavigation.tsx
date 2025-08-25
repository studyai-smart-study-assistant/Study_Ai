
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, FileText, Calendar, BookOpen, Sparkles, GraduationCap } from 'lucide-react';

interface ToolsTabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  translations: {
    quizGenerator: string;
    notesGenerator: string;
    studyPlanner: string;
    homeworkAssistant: string;
    motivationSystem: string;
    teacherMode: string;
  };
}

const ToolsTabNavigation: React.FC<ToolsTabNavigationProps> = ({ 
  activeTab, 
  onTabChange,
  translations 
}) => {
  return (
    <TabsList className="w-full grid grid-cols-6 bg-purple-50 dark:bg-gray-800 p-1">
      <TabsTrigger 
        value="teacher" 
        className="flex flex-col items-center py-2 px-1 text-xs sm:text-sm"
        onClick={() => onTabChange('teacher')}
      >
        <GraduationCap className="h-4 w-4 mb-1" />
        {translations.teacherMode.split(' ')[0]}
      </TabsTrigger>
      <TabsTrigger 
        value="notes" 
        className="flex flex-col items-center py-2 px-1 text-xs sm:text-sm"
        onClick={() => onTabChange('notes')}
      >
        <FileText className="h-4 w-4 mb-1" />
        {translations.notesGenerator.split(' ')[0]}
      </TabsTrigger>
      <TabsTrigger 
        value="planner" 
        className="flex flex-col items-center py-2 px-1 text-xs sm:text-sm"
        onClick={() => onTabChange('planner')}
      >
        <Calendar className="h-4 w-4 mb-1" />
        {translations.studyPlanner.split(' ')[0]}
      </TabsTrigger>
      <TabsTrigger 
        value="homework" 
        className="flex flex-col items-center py-2 px-1 text-xs sm:text-sm"
        onClick={() => onTabChange('homework')}
      >
        <BookOpen className="h-4 w-4 mb-1" />
        {translations.homeworkAssistant.split(' ')[0]}
      </TabsTrigger>
      <TabsTrigger 
        value="motivation" 
        className="flex flex-col items-center py-2 px-1 text-xs sm:text-sm"
        onClick={() => onTabChange('motivation')}
      >
        <Sparkles className="h-4 w-4 mb-1" />
        {translations.motivationSystem.split(' ')[0]}
      </TabsTrigger>
      <TabsTrigger 
        value="quiz" 
        className="flex flex-col items-center py-2 px-1 text-xs sm:text-sm"
        onClick={() => onTabChange('quiz')}
      >
        <BrainCircuit className="h-4 w-4 mb-1" />
        {translations.quizGenerator.split(' ')[0]}
      </TabsTrigger>
    </TabsList>
  );
};

export default ToolsTabNavigation;
