import { toast } from "sonner";
import { Message } from "./db";
import { chatDB } from "./db";
import { supabase } from "@/integrations/supabase/client";
import { generateComprehensiveAITeacherPrompt, generateAdaptiveUpdatePrompt, AITeacherPromptConfig } from "./ai-teacher-prompt-generator";
import { validateTopicsAgainstSyllabus } from "@/data/syllabus/syllabusDatabase";
import { ExamPlanData, StudyPlan } from "@/components/study/examplanner/types";

export interface EnhancedGenerationOptions {
  promptConfig?: AITeacherPromptConfig;
  includeSyllabusValidation?: boolean;
  includeAdaptiveContent?: boolean;
  userProgressData?: any;
  performanceData?: any;
  useAITeacherMode?: boolean;
}

/**
 * Study AI - Smart Study Assistant
 * Developer: Ajit Kumar
 * Version: 2.1 (Build Fixed)
 */

export async function generateEnhancedStudyPlan(
  examData: ExamPlanData,
  options: EnhancedGenerationOptions = {}
): Promise<StudyPlan> {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`🧠 Study AI: Generating plan attempt ${retryCount + 1}`);
      
      const aiTeacherPrompt = generateComprehensiveAITeacherPrompt(examData, {
        includeFullSyllabus: options.includeSyllabusValidation ?? true,
        includeLearningStyleAdaptation: true,
        includeProgressiveAdaptation: options.includeAdaptiveContent ?? false,
        includeDetailedStudyMethods: true,
        responseFormat: 'structured_json',
        personalizedMotivation: true
      }, options.userProgressData);

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: aiTeacherPrompt,
          history: [],
          chatId: undefined,
          apiKeyType: 'default'
        }
      });

      if (error) throw new Error(`Supabase error: ${error.message}`);
      if (!data?.success) throw new Error(data?.error || "AI service failed");

      const responseText = data.response;
      const studyPlan = await parseAndValidateAITeacherResponse(responseText, examData);
      
      if (options.includeSyllabusValidation) {
        await validateAndEnhanceWithSyllabus(studyPlan, examData);
      }
      
      toast.success("आपका स्मार्ट स्टडी प्लान तैयार है!");
      return studyPlan;
      
    } catch (error: any) {
      console.error(`❌ Build attempt failed:`, error);
      retryCount++;
      
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.info("AI Teacher प्लान को रिफाइन कर रहा है...");
        continue;
      }
      
      toast.error("स्टडी प्लान बनाने में समस्या आई। कृपया पुनः प्रयास करें।");
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

async function parseAndValidateAITeacherResponse(responseText: string, examData: ExamPlanData): Promise<StudyPlan> {
  try {
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
      const parsedData = JSON.parse(jsonString);
      return convertAITeacherJSONToStudyPlan(parsedData, examData);
    }
    throw new Error('No JSON found');
  } catch (error) {
    return await convertNaturalLanguageToStructured(responseText, examData);
  }
}

function convertAITeacherJSONToStudyPlan(aiData: any, examData: ExamPlanData): StudyPlan {
  return {
    overview: aiData.plan_overview?.exam_strategy || "Custom Study Strategy",
    totalDaysAvailable: aiData.plan_overview?.total_days_available || 30,
    dailyStudyHours: aiData.plan_overview?.daily_study_hours || examData.dailyHours,
    subjectPlans: convertSubjectPlans(aiData.subject_wise_strategy || {}),
    dailyTasks: convertDailyTasks(aiData.daily_schedule || []),
    weeklyGoals: convertWeeklyGoals(aiData.weekly_milestones || []),
    revisionStrategy: aiData.exam_preparation_strategy?.last_week_plan || "Focused Revision",
    examTips: extractExamTips(aiData, examData),
    motivationalQuotes: aiData.daily_motivation_messages || ["Keep pushing forward!"],
    progressMilestones: generateProgressMilestones(aiData.weekly_milestones || []),
    personalizedAnalysis: aiData.personalized_analysis,
    adaptiveRecommendations: aiData.adaptive_recommendations
  };
}

function convertSubjectPlans(subjectStrategy: any): any[] {
  return Object.entries(subjectStrategy).map(([subjectName, data]: [string, any]) => ({
    subjectName,
    priorityLevel: data.priority_ranking <= 2 ? 'high' : 'medium',
    totalHours: data.total_hours_allocated || 20,
    chapters: (data.chapter_wise_breakdown || []).map((chapter: any) => ({
      chapterNumber: chapter.chapter_number || 1,
      chapterName: chapter.chapter_name,
      importance: chapter.importance || 'medium',
      estimatedHours: chapter.estimated_hours || 2,
      topics: (chapter.topics || []).map((topicName: string) => ({
        topicName,
        importance: chapter.importance || 'medium',
        estimatedMinutes: 45,
        keyPoints: [chapter.study_approach || "Focus on concepts"],
        studyTips: chapter.common_mistakes_to_avoid || [],
        practiceQuestions: [`Practice ${topicName}`]
      }))
    }))
  }));
}

function convertDailyTasks(dailySchedule: any[]): any[] {
  const tasks: any[] = [];
  dailySchedule.forEach((day, index) => {
    const sessions = ['morning_session', 'afternoon_session', 'evening_session', 'revision_session'];
    sessions.forEach(sessionKey => {
      const session = day[sessionKey];
      if (session && session.subject) {
        tasks.push({
          id: `task_${index}_${sessionKey}_${Date.now()}`,
          date: day.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subject: session.subject,
          chapter: session.chapter || "Study Session",
          topics: session.topics || [session.subject],
          duration: session.duration_minutes || 60,
          type: sessionKey.includes('revision') ? 'revision' : 'study',
          priority: 'important',
          description: session.study_method || "Core study session",
          completed: false,
          studyMethod: session.study_method,
          whyThisTiming: session.why_this_timing
        });
      }
    });
  });
  return tasks;
}

function convertWeeklyGoals(weeklyMilestones: any[]): any[] {
  return weeklyMilestones.map((m, i) => ({
    week: m.week || i + 1,
    subjects: m.chapters_to_complete || [],
    chapters: m.chapters_to_complete || [],
    targetCompletion: 100,
    focus: m.goals?.join(', ') || "Weekly Goals",
    assessmentMethod: "Self Assessment",
    successMetrics: "Completion"
  }));
}

function extractExamTips(aiData: any, examData: ExamPlanData): string[] {
  const tips: string[] = [];
  const name = examData.examName.toLowerCase();
  if (name.includes('bihar') || name.includes('bseb')) {
    tips.push("BSEB Tip: No negative marking, do not leave any MCQ blank.");
    tips.push("Use 15 min extra time for reading long questions.");
  }
  return tips.length > 0 ? tips : ["Stay consistent", "Revise daily"];
}

function generateProgressMilestones(milestones: any[]): any[] {
  return milestones.map((m, i) => ({
    week: i + 1,
    target: m.goals?.[0] || "Target reached",
    description: m.success_metrics || "Progress tracking",
    completed: false
  }));
}

async function convertNaturalLanguageToStructured(text: string, examData: ExamPlanData): Promise<StudyPlan> {
  return {
    overview: "Plan generated from AI analysis",
    totalDaysAvailable: 30,
    dailyStudyHours: examData.dailyHours,
    subjectPlans: [],
    dailyTasks: [],
    weeklyGoals: [],
    revisionStrategy: "Active Recall",
    examTips: ["Focus on weak areas"],
    motivationalQuotes: ["Consistency is key"],
    progressMilestones: []
  };
}

async function validateAndEnhanceWithSyllabus(plan: StudyPlan, examData: ExamPlanData): Promise<void> {
  try {
    for (const sub of plan.subjectPlans) {
      const topics = sub.chapters.flatMap((c: any) => c.topics.map((t: any) => t.topicName));
      validateTopicsAgainstSyllabus(examData.examName, sub.subjectName, topics);
    }
  } catch (e) {
    console.warn("Validation skipped");
  }
}

export async function generateAdaptiveStudyPlanUpdate(
  originalPlan: StudyPlan,
  examData: ExamPlanData,
  completedTasks: any[],
  pendingTasks: any[],
  userFeedback: string,
  difficulties: string[]
): Promise<StudyPlan> {
  const adaptivePrompt = generateAdaptiveUpdatePrompt(originalPlan, completedTasks, pendingTasks, userFeedback, difficulties);
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: { prompt: adaptivePrompt, history: [], chatId: undefined, apiKeyType: 'default' }
  });
  if (error || !data?.success) throw new Error('Update failed');
  return await parseAndValidateAITeacherResponse(data.response, examData);
}
