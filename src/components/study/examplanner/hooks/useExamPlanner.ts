
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { generateEnhancedStudyPlan } from '@/lib/enhanced-gemini';
import { ExamPlanData, StudyPlan } from '../types';

interface SavedExamPlan {
  id: string;
  examName: string;
  examDate: string;
  class: string;
  subjects: string[];
  customSubjects: string[];
  dailyHours: number;
  currentStudyStatus: string;
  studyPlan: StudyPlan;
  examData: ExamPlanData;
  isActive: boolean;
  status: 'active' | 'paused' | 'completed' | 'draft';
  createdAt: string;
  lastModified: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  daysLeft: number;
}

export const useExamPlanner = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<'management' | 'input' | 'plan' | 'track' | 'strategy'>('management');
  const [examData, setExamData] = useState<ExamPlanData | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SavedExamPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planProgress, setPlanProgress] = useState(0);

  const handleExamDataSubmit = async (data: ExamPlanData) => {
    setIsGenerating(true);
    setPlanProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setPlanProgress(prev => Math.min(prev + 5, 90));
      }, 400);

      // Use enhanced AI Teacher system for plan generation
      const generatedPlan = await generateEnhancedStudyPlan(data, {
        includeSyllabusValidation: true,
        includeAdaptiveContent: false,
        useAITeacherMode: true,
        promptConfig: {
          includeFullSyllabus: true,
          includeLearningStyleAdaptation: true,
          includeProgressiveAdaptation: false,
          includeDetailedStudyMethods: true,
          responseFormat: 'structured_json',
          personalizedMotivation: true
        }
      });
      
      clearInterval(progressInterval);
      setPlanProgress(100);
      
      setExamData(data);
      setStudyPlan(generatedPlan);
      
      const newPlan: SavedExamPlan = {
        id: `ai_teacher_plan_${Date.now()}`,
        examName: data.examName,
        examDate: data.examDate,
        class: data.class || 'Not specified',
        subjects: data.subjects,
        customSubjects: data.customSubjects || [],
        dailyHours: data.dailyHours || 2,
        currentStudyStatus: data.currentStatus || data.currentStudyStatus || 'Getting started',
        studyPlan: generatedPlan,
        examData: data,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        progress: 0,
        totalTasks: generatedPlan.dailyTasks?.length || 0,
        completedTasks: 0,
        daysLeft: Math.ceil((new Date(data.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      };
      
      if (currentUser?.uid) {
        const existingPlans = localStorage.getItem(`study_plans_${currentUser.uid}`);
        const plans: SavedExamPlan[] = existingPlans ? JSON.parse(existingPlans) : [];
        plans.push(newPlan);
        localStorage.setItem(`study_plans_${currentUser.uid}`, JSON.stringify(plans));
        localStorage.setItem(`active_study_plan_${currentUser.uid}`, JSON.stringify(newPlan));
      }
      
      setCurrentPlan(newPlan);
      setCurrentView('plan');
      
      toast.success('🎉 आपकी AI Teacher द्वारा निर्मित व्यक्तिगत अध्ययन योजना तैयार!', {
        description: 'Comprehensive syllabus-validated plan with detailed study methods',
        duration: 4000
      });
    } catch (error) {
      console.error('Error generating AI Teacher study plan:', error);
      toast.error('AI Teacher plan generation में त्रुटि हुई। कृपया पुनः प्रयास करें।', {
        description: 'हमारा AI Teacher आपकी मदद के लिए 24/7 उपलब्ध है',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPlan = (plan: SavedExamPlan) => {
    setCurrentPlan(plan);
    setExamData(plan.examData);
    setStudyPlan(plan.studyPlan);
    setCurrentView('plan');
    
    if (currentUser?.uid) {
      localStorage.setItem(`active_study_plan_${currentUser.uid}`, JSON.stringify(plan));
    }
    
    toast.success(`📚 AI Teacher Plan "${plan.examName}" activated!`, {
      description: 'All personalized recommendations और progress tracking active'
    });
  };

  const handleCreateNew = () => {
    setCurrentView('input');
    setExamData(null);
    setStudyPlan(null);
    setCurrentPlan(null);
    
    toast.info('🧠 AI Teacher नई योजना बनाने के लिए तैयार है!', {
      description: 'सभी जानकारी दें ताकि हम आपके लिए perfect plan बना सकें'
    });
  };

  const handleBackToManagement = () => {
    setCurrentView('management');
    setExamData(null);
    setStudyPlan(null);
    setCurrentPlan(null);
  };

  return {
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
  };
};
