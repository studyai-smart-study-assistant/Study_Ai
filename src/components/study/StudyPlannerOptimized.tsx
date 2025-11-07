
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Target,
  BookOpen,
  Calculator,
  FileText,
  Users,
  Trophy,
  Download,
  Library
} from 'lucide-react';

// Lazy load heavy components to improve performance
const ExamPlannerMain = React.lazy(() => import('./examplanner/ExamPlannerMain'));
const HomeworkAssistantWrapper = React.lazy(() => import('./HomeworkAssistantWrapper'));
const EnhancedNotesGeneratorWrapper = React.lazy(() => import('./EnhancedNotesGeneratorWrapper'));
const SmartContentLibrary = React.lazy(() => import('./content-library/SmartContentLibrary'));
const AdvancedGamificationSystem = React.lazy(() => import('./gamification/AdvancedGamificationSystem'));
const StudyGroupsCollaboration = React.lazy(() => import('./collaboration/StudyGroupsCollaboration'));
const BrowserContentManager = React.lazy(() => import('./BrowserContentManager'));

interface StudyPlannerProps {
  onSendMessage: (msg: string) => void;
}

const StudyPlannerOptimized: React.FC<StudyPlannerProps> = ({ onSendMessage }) => {
  const [activeTab, setActiveTab] = useState('exam-prep');

  const tabs = useMemo(() => [
    {
      id: 'exam-prep',
      label: 'परीक्षा तैयारी',
      icon: Target,
      description: 'AI टीचर के साथ comprehensive exam preparation',
      component: ExamPlannerMain,
      category: 'core'
    },
    {
      id: 'homework',
      label: 'होमवर्क हेल्प',
      icon: Calculator,
      description: 'Step-by-step homework solutions',
      component: HomeworkAssistantWrapper,
      category: 'core'
    },
    {
      id: 'notes',
      label: 'स्मार्ट नोट्स',
      icon: FileText,
      description: 'AI-powered notes generation',
      component: EnhancedNotesGeneratorWrapper,
      category: 'core'
    },
    {
      id: 'content-library',
      label: 'कंटेंट लाइब्रेरी',
      icon: Library,
      description: 'Smart content management',
      component: SmartContentLibrary,
      category: 'advanced',
      isNew: true
    },
    {
      id: 'gamification',
      label: 'अचीवमेंट्स',
      icon: Trophy,
      description: 'Gamification और rewards',
      component: AdvancedGamificationSystem,
      category: 'advanced',
      isNew: true
    },
    {
      id: 'collaboration',
      label: 'स्टडी ग्रुप',
      icon: Users,
      description: 'Collaborative learning',
      component: StudyGroupsCollaboration,
      category: 'advanced',
      isNew: true
    },
    {
      id: 'browser-storage',
      label: 'ब्राउज़र स्टोरेज',
      icon: Download,
      description: 'Browser-based content storage',
      component: BrowserContentManager,
      category: 'advanced',
      isNew: true
    }
  ], []);

  const coreFeatures = useMemo(() => tabs.filter(tab => tab.category === 'core'), [tabs]);
  const advancedFeatures = useMemo(() => tabs.filter(tab => tab.category === 'advanced'), [tabs]);

  const currentTab = useMemo(() => tabs.find(tab => tab.id === activeTab), [tabs, activeTab]);

  return (
    <CardContent className="p-3 md:p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            स्मार्ट स्टडी टूल्स
          </h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
              AI Teacher
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-xs">
              Optimized ⚡
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="space-y-4">
            {/* Core Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">मुख्य फीचर्स</h4>
              <TabsList className="grid w-full grid-cols-3">
                {coreFeatures.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 text-xs">
                      <IconComponent className="h-3 w-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Advanced Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">एडवांस फीचर्स</h4>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                {advancedFeatures.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 relative text-xs">
                      <IconComponent className="h-3 w-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.isNew && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0">
                          नया
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* Lazy loaded tab content */}
          {currentTab && (
            <TabsContent key={currentTab.id} value={currentTab.id} className="mt-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-purple-700 dark:text-purple-300">
                    {currentTab.label}
                  </h4>
                  {currentTab.isNew && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      ✨ नया फीचर
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentTab.description}
                </p>
              </div>
              
              <React.Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              }>
                <currentTab.component onSendMessage={onSendMessage} />
              </React.Suspense>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </CardContent>
  );
};

export default React.memo(StudyPlannerOptimized);
