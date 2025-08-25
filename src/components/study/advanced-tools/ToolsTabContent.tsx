
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import QuizGenerator from '../QuizGenerator';

import StudyPlanner from '../StudyPlanner';
import HomeworkAssistant from '../HomeworkAssistant';
import MotivationSystem from '../MotivationSystem';
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
      
      
      <TabsContent value="planner" className="mt-0">
        <StudyPlanner onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="homework" className="mt-0">
        <HomeworkAssistant onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="motivation" className="mt-0">
        <MotivationSystem onSendMessage={onSendMessage} />
      </TabsContent>
      
      <TabsContent value="quiz" className="mt-0">
        <QuizGenerator onSendMessage={onSendMessage} />
      </TabsContent>
    </div>
  );
};

export default ToolsTabContent;
