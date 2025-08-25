
import React from 'react';
import { toast } from 'sonner';
import ExamDetailsInput from './ExamDetailsInput';
import StudyPlanDisplay from './StudyPlanDisplay';
import ProgressTracker from './ProgressTracker';
import DailyTaskManager from './DailyTaskManager';
import PlanManagementSystem from './PlanManagementSystem';
import EnhancedExamStrategy from './EnhancedExamStrategy';
import EnhancedPersonalizationEngine from './EnhancedPersonalizationEngine';
import PerformanceAnalytics from './PerformanceAnalytics';
import PlannerHeader from './components/PlannerHeader';
import NavigationBar from './components/NavigationBar';
import MobileOptimizedLayout from '../../layout/MobileOptimizedLayout';
import { useExamPlanner } from './hooks/useExamPlanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  BarChart3, 
  Settings,
  Sparkles,
  Zap,
  Target,
  CheckCircle,
  Calendar
} from 'lucide-react';

interface ExamPlannerMainProps {
  onSendMessage: (msg: string) => void;
}

const ExamPlannerMain: React.FC<ExamPlannerMainProps> = ({ onSendMessage }) => {
  const {
    currentView,
    examData,
    studyPlan,
    currentPlan,
    isGenerating,
    planProgress,
    setCurrentView,
    handleExamDataSubmit,
    handleSelectPlan,
    handleCreateNew,
    handleBackToManagement
  } = useExamPlanner();

  const handleStartTracking = () => {
    if (studyPlan && examData && currentPlan) {
      setCurrentView('track');
      toast.success('📊 प्रगति ट्रैकिंग सक्रिय हो गई!');
    }
  };

  const handleViewStrategy = () => {
    if (studyPlan && examData) {
      setCurrentView('strategy');
      toast.success('🎯 AI रणनीतियां अनलॉक हो गईं!');
    }
  };

  const handleApplyStrategy = (strategy: any) => {
    toast.success(`✅ "${strategy.title}" लागू हो गई!`);
  };

  const handleUpdatePlan = (updatedPlan: any) => {
    toast.success('🚀 योजना को बेहतर बनाया गया!');
  };

  return (
    <MobileOptimizedLayout
      title="AI परीक्षा योजनाकार"
      subtitle="🎯 AI व्यक्तिगत • 📊 विश्लेषण • 🧠 पाठ्यक्रम आधारित"
      actions={
        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs px-2 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            AI 2.0
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs px-2 py-1">
            <Zap className="h-3 w-3 mr-1" />
            उन्नत
          </Badge>
        </div>
      }
      collapsible={true}
    >
      <div className="space-y-4">
        <PlannerHeader 
          isGenerating={isGenerating} 
          planProgress={planProgress}
        />

        {currentView !== 'management' && (
          <NavigationBar 
            currentView={currentView} 
            onBackToManagement={handleBackToManagement} 
          />
        )}

        {/* Content based on current view */}
        {currentView === 'management' && (
          <PlanManagementSystem 
            onCreateNew={handleCreateNew}
            onSelectPlan={handleSelectPlan}
          />
        )}

        {currentView === 'input' && (
          <ExamDetailsInput 
            onSubmit={handleExamDataSubmit}
            isLoading={isGenerating}
          />
        )}

        {currentView === 'plan' && studyPlan && examData && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="overview" className="text-xs flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span className="hidden sm:inline">योजना</span>
              </TabsTrigger>
              <TabsTrigger value="personalization" className="text-xs flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span className="hidden sm:inline">AI व्यक्तिगत</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span className="hidden sm:inline">विश्लेषण</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 mt-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  उन्नत सुविधाएं
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800 text-xs">✓ पाठ्यक्रम आधारित</Badge>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">✓ AI व्यक्तिगत</Badge>
                  <Badge className="bg-purple-100 text-purple-800 text-xs">✓ अनुकूलनीय</Badge>
                  <Badge className="bg-orange-100 text-orange-800 text-xs">✓ अनुकूलित</Badge>
                </div>
              </div>
              
              <StudyPlanDisplay 
                studyPlan={studyPlan}
                examData={examData}
                onStartTracking={handleStartTracking}
                onViewStrategy={handleViewStrategy}
                onBackToInput={handleBackToManagement}
                onSendMessage={onSendMessage}
              />
            </TabsContent>

            <TabsContent value="personalization" className="space-y-3 mt-3">
              <EnhancedPersonalizationEngine
                studyPlan={studyPlan}
                examData={examData}
                onUpdatePlan={handleUpdatePlan}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-3 mt-3">
              <PerformanceAnalytics />
            </TabsContent>
          </Tabs>
        )}

        {currentView === 'strategy' && studyPlan && examData && (
          <EnhancedExamStrategy
            studyPlan={studyPlan}
            examData={examData}
            onApplyStrategy={handleApplyStrategy}
          />
        )}

        {currentView === 'track' && studyPlan && examData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                प्रगति ट्रैकिंग सक्रिय
              </h4>
              <p className="text-xs text-green-700">
                Real-time प्रगति विश्लेषण और अनुकूलनीय सुझाव
              </p>
            </div>
            
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="progress" className="text-xs flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">प्रगति</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">कार्य</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden sm:inline">विश्लेषण</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-3 mt-3">
                <ProgressTracker 
                  studyPlan={studyPlan}
                  examData={examData}
                  onSendMessage={onSendMessage}
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-3 mt-3">
                <DailyTaskManager 
                  studyPlan={studyPlan}
                  examData={examData}
                />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-3 mt-3">
                <PerformanceAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </MobileOptimizedLayout>
  );
};

export default ExamPlannerMain;
