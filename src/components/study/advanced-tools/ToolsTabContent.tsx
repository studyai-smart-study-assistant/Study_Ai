
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import QuizGeneratorWrapper from '../QuizGeneratorWrapper';
import EnhancedNotesGeneratorWrapper from '../EnhancedNotesGeneratorWrapper';
import StudyPlannerWrapper from '../StudyPlannerWrapper';
import HomeworkAssistantWrapper from '../HomeworkAssistantWrapper';
import MotivationSystemWrapper from '../MotivationSystemWrapper';
import TeacherMode from '../TeacherMode';

interface ToolsTabContentProps {
  activeTab: string;
  onSendMessage: (message: string) => void;
}

const ToolsTabContent: React.FC<ToolsTabContentProps> = ({ activeTab, onSendMessage }) => {
  return (
    <div className="p-4">
      <TabsContent value="teacher" className="mt-0">
        <TeacherMode onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="notes" className="mt-0">
        <EnhancedNotesGeneratorWrapper onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="planner" className="mt-0">
        <StudyPlannerWrapper onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="homework" className="mt-0">
        <HomeworkAssistantWrapper onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="motivation" className="mt-0">
        <MotivationSystemWrapper onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="quiz" className="mt-0">
        <QuizGeneratorWrapper onSendMessage={onSendMessage} />
      </TabsContent>
    </div>
  );
};

export default ToolsTabContent;
