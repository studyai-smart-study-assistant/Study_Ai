
import React, { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import AdvancedToolsHeader from './advanced-tools/AdvancedToolsHeader';
import ToolsTabNavigation from './advanced-tools/ToolsTabNavigation';
import ToolsTabContent from './advanced-tools/ToolsTabContent';

interface AdvancedStudyToolsProps {
  onSendMessage: (message: string) => void;
}

const AdvancedStudyTools: React.FC<AdvancedStudyToolsProps> = ({ onSendMessage }) => {
  const [activeTab, setActiveTab] = useState('teacher');
  const { t } = useLanguage();

  const tabTranslations = {
    quizGenerator: t('quizGenerator'),
    notesGenerator: t('notesGenerator'),
    studyPlanner: t('studyPlanner'),
    homeworkAssistant: t('homeworkAssistant'),
    motivationSystem: t('motivationSystem'),
    teacherMode: t('teacherMode')
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <AdvancedToolsHeader 
        title={t('advancedStudyTools')} 
        description={t('personalizedTools')} 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ToolsTabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          translations={tabTranslations}
        />
        
        <div className="p-2 sm:p-4">
          <ToolsTabContent
            activeTab={activeTab}
            onSendMessage={onSendMessage}
          />
        </div>
      </Tabs>
    </div>
  );
};

export default AdvancedStudyTools;
