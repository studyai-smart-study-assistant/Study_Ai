
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyPlan, ExamPlanData } from './types';
import DetailedChapterView from './DetailedChapterView';
import PlanOverviewStats from './components/PlanOverviewStats';
import WeeklyGoalsCard from './components/WeeklyGoalsCard';
import StudyPlanHeader from './components/StudyPlanHeader';
import StudyPlanActions from './components/StudyPlanActions';
import FixedSubjectPlanCard from './components/FixedSubjectPlanCard';
import DailyScheduleView from './components/DailyScheduleView';
import ExamTipsView from './components/ExamTipsView';
import TodaysDashboard from './components/TodaysDashboard';
import ErrorBoundary from '../../ErrorBoundary';
import { BarChart3, BookOpen, Calendar, Lightbulb, X, Target } from 'lucide-react';

interface StudyPlanDisplayProps {
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  onStartTracking: () => void;
  onViewStrategy?: () => void;
  onBackToInput: () => void;
  onSendMessage: (msg: string) => void;
}

const StudyPlanDisplay: React.FC<StudyPlanDisplayProps> = ({
  studyPlan,
  examData,
  onStartTracking,
  onViewStrategy,
  onBackToInput,
  onSendMessage
}) => {
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  const handleTopicComplete = (topicName: string, feedback: any) => {
    setCompletedTopics(prev => [...prev, topicName]);
  };

  const handleStartQuiz = (topic: string) => {
    onSendMessage(`मुझे "${topic}" के लिए एक interactive quiz बनाकर दें। MCQ और detailed explanations के साथ।`);
  };

  const handleGenerateNotes = (topic: string) => {
    onSendMessage(`कृपया "${topic}" के लिए comprehensive notes बनाएं। Points, examples और diagrams के साथ।`);
  };

  const handleStartTeaching = (topic: string) => {
    onSendMessage(`मैं "${topic}" सीखना चाहता हूं। कृपया step by step interactive teaching करें।`);
  };

  const calculateDaysLeft = () => {
    const examDate = new Date(examData.examDate);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft();

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {/* Plan Overview Header */}
        <StudyPlanHeader 
          studyPlan={studyPlan}
          examData={examData}
          daysLeft={daysLeft}
        />

        {/* Action Buttons */}
        <StudyPlanActions
          onStartTracking={onStartTracking}
          onViewStrategy={onViewStrategy}
          onSendMessage={onSendMessage}
          examData={examData}
        />

        {/* Study Plan Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-10">
            <TabsTrigger value="today" className="text-xs flex items-center gap-1 px-2">
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">आज का प्लान</span>
              <span className="sm:hidden">आज</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs flex items-center gap-1 px-2">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">सिंहावलोकन</span>
              <span className="sm:hidden">ओवरव्यू</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="text-xs flex items-center gap-1 px-2">
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">विषय</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs flex items-center gap-1 px-2">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">समय सारणी</span>
              <span className="sm:hidden">टाइम</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs flex items-center gap-1 px-2">
              <Lightbulb className="h-3 w-3" />
              <span className="hidden sm:inline">सुझाव</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-3">
            <TodaysDashboard
              studyPlan={studyPlan}
              examData={examData}
              onStartQuiz={handleStartQuiz}
              onGenerateNotes={handleGenerateNotes}
              onStartTeaching={handleStartTeaching}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-3 mt-3">
            <PlanOverviewStats studyPlan={studyPlan} />
            <WeeklyGoalsCard studyPlan={studyPlan} />
          </TabsContent>

          <TabsContent value="subjects" className="space-y-3 mt-3">
            {studyPlan.subjectPlans.map((subject, index) => (
              <FixedSubjectPlanCard
                key={index}
                subject={subject}
                onChapterClick={setSelectedChapter}
              />
            ))}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-3 mt-3">
            <DailyScheduleView studyPlan={studyPlan} />
          </TabsContent>

          <TabsContent value="tips" className="space-y-3 mt-3">
            <ExamTipsView studyPlan={studyPlan} />
          </TabsContent>
        </Tabs>

        {/* Detailed Chapter View Modal */}
        {selectedChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-base font-semibold">अध्याय विवरण</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedChapter(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <DetailedChapterView 
                  chapter={selectedChapter}
                  onTopicComplete={handleTopicComplete}
                  completedTopics={completedTopics}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default StudyPlanDisplay;
