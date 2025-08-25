
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Target,
  Calculator,
  FileText,
  Trophy,
  Sparkles
} from 'lucide-react';
import ExamPlannerMain from './examplanner/ExamPlannerMain';
import SmartHomeworkAssistant from './SmartHomeworkAssistant';
import EnhancedNotesGenerator from './EnhancedNotesGenerator';

interface StudyPlannerProps {
  onSendMessage: (msg: string) => void;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ onSendMessage }) => {
  const [activeTab, setActiveTab] = useState('exam-prep');

  const tabs = [
    {
      id: 'exam-prep',
      label: 'परीक्षा तैयारी',
      shortLabel: 'परीक्षा',
      icon: Target,
      description: 'AI टीचर के साथ comprehensive exam preparation',
      component: ExamPlannerMain,
      category: 'core'
    },
    {
      id: 'homework',
      label: 'होमवर्क हेल्प',
      shortLabel: 'होमवर्क',
      icon: Calculator,
      description: 'Step-by-step homework solutions',
      component: SmartHomeworkAssistant,
      category: 'core'
    },
    {
      id: 'notes',
      label: 'स्मार्ट नोट्स',
      shortLabel: 'नोट्स',
      icon: FileText,
      description: 'AI-powered notes generation',
      component: EnhancedNotesGenerator,
      category: 'core'
    }
  ];

  return (
    <CardContent className="p-2 sm:p-4">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="hidden sm:inline">स्मार्ट स्टडी टूल्स</span>
            <span className="sm:hidden">स्टडी टूल्स</span>
          </h3>
          <div className="flex gap-1 sm:gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs px-2 py-1">
              <Trophy className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">AI Teacher</span>
              <span className="sm:hidden">AI</span>
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Enhanced</span>
              <span className="sm:hidden">नया</span>
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-1 text-xs sm:text-sm px-1 sm:px-3"
                >
                  <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map(tab => {
            const ComponentToRender = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-3 sm:mt-6">
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-purple-700 dark:text-purple-300 text-sm sm:text-base">
                      {tab.label}
                    </h4>
                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">✨ Enhanced</span>
                      <span className="sm:hidden">✨</span>
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {tab.description}
                  </p>
                </div>
                <ComponentToRender onSendMessage={onSendMessage} />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </CardContent>
  );
};

export default StudyPlanner;
