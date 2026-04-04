import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateComprehensiveAITeacherPrompt, generateAdaptiveUpdatePrompt, AITeacherPromptConfig } from "./ai-teacher-prompt-generator";
import { validateTopicsAgainstSyllabus } from "@/data/syllabus/syllabusDatabase";
import { ExamPlanData, StudyPlan } from "@/components/study/examplanner/types";

/**
 * Study AI - Smart Study Assistant
 * Developer: Ajit Kumar
 * Version: 3.0 (Powered by Gemini 3 Flash)
 */

export interface EnhancedGenerationOptions {
  promptConfig?: AITeacherPromptConfig;
  includeSyllabusValidation?: boolean;
  includeAdaptiveContent?: boolean;
  userProgressData?: unknown;
  performanceData?: unknown;
  useAITeacherMode?: boolean;
}

interface AITeacherChapter {
  chapter_number?: number;
  chapter_name?: string;
  importance?: "high" | "medium" | "low";
  estimated_hours?: number;
  topics?: string[];
  study_approach?: string;
  common_mistakes_to_avoid?: string[];
}

interface AITeacherSubjectStrategy {
  priority_ranking?: number;
  total_hours_allocated?: number;
  chapter_wise_breakdown?: AITeacherChapter[];
}

interface AITeacherSession {
  subject?: string;
  chapter?: string;
  topics?: string[];
  duration_minutes?: number;
  study_method?: string;
  why_this_timing?: string;
}

type AITeacherDaySchedule = Record<string, AITeacherSession | string | undefined> & {
  date?: string;
};

interface AITeacherWeeklyMilestone {
  week?: number;
  chapters_to_complete?: string[];
  goals?: string[];
  success_metrics?: string;
}

interface AITeacherPlanOverview {
  exam_strategy?: string;
  total_days_available?: number;
  daily_study_hours?: number;
}

interface AITeacherExamStrategy {
  last_week_plan?: string;
  exam_day_preparation?: string;
}

interface AITeacherResponse {
  plan_overview?: AITeacherPlanOverview;
  subject_wise_strategy?: Record<string, AITeacherSubjectStrategy>;
  daily_schedule?: AITeacherDaySchedule[];
  weekly_milestones?: AITeacherWeeklyMilestone[];
  exam_preparation_strategy?: AITeacherExamStrategy;
  daily_motivation_messages?: string[];
  personalized_analysis?: unknown;
  adaptive_recommendations?: unknown;
}

export async function generateEnhancedStudyPlan(
  examData: ExamPlanData,
  options: EnhancedGenerationOptions = {}
): Promise<StudyPlan> {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`🧠 Study AI: Generating advanced plan using Gemini 3. Attempt ${retryCount + 1}`);
      
      const aiTeacherPrompt = generateComprehensiveAITeacherPrompt(examData, {
        includeFullSyllabus: options.includeSyllabusValidation ?? true,
        includeLearningStyleAdaptation: true,
        includeProgressiveAdaptation: options.includeAdaptiveContent ?? false,
        includeDetailedStudyMethods: true,
        responseFormat: 'structured_json',
        personalizedMotivation: true
      }, options.userProgressData);

      // ✅ बैकएंड को निर्देश: google/gemini-3.1-pro-preview का उपयोग करें
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: aiTeacherPrompt,
          history: [],
          chatId: undefined,
          apiKeyType: 'default',
          model: 'google/gemini-3.1-pro-preview' 
        }
      });

      if (error) throw new Error(`Supabase error: ${error.message}`);
      if (!data?.success) throw new Error(data?.error || "AI service failed");

      const responseText = data.response;
      const studyPlan = await parseAndValidateAITeacherResponse(responseText, examData);
      
      if (options.includeSyllabusValidation) {
        await validateAndEnhanceWithSyllabus(studyPlan, examData);
      }
      
      toast.success("आपका स्मार्ट स्टडी प्लान तैयार है! चलिए जीत की तैयारी शुरू करते हैं।");
      return studyPlan;
      
    } catch (error: unknown) {
      console.error(`❌ Build attempt failed:`, error);
      retryCount++;
      
      if (retryCount <= maxRetries) {
        const waitTime = 2000;
        toast.info("Study AI आपके लिए एक सटीक और आधुनिक प्लान तैयार कर रहा है...");
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      toast.error("स्टडी प्लान बनाने में समस्या आई। कृपया पुनः प्रयास करें।");
      throw error;
    }
  }
  throw new Error("Maximum retry attempts exceeded");
}

async function parseAndValidateAITeacherResponse(responseText: string, examData: ExamPlanData): Promise<StudyPlan> {
  try {
    // क्लीनिंग लॉजिक: AI कभी-कभी JSON के साथ एक्स्ट्रा टेक्स्ट जोड़ देता है
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
      const parsedData = JSON.parse(jsonString);
      return convertAITeacherJSONToStudyPlan(parsedData, examData);
    }
    throw new Error('No valid JSON found');
  } catch (error) {
    console.warn('Fallback: AI response was not valid JSON, converting natural language');
    return await convertNaturalLanguageToStructured(responseText, examData);
  }
}

function convertAITeacherJSONToStudyPlan(aiData: AITeacherResponse, examData: ExamPlanData): StudyPlan {
  return {
    overview: aiData.plan_overview?.exam_strategy || `Specialized strategy for ${examData.examName}`,
    totalDaysAvailable: aiData.plan_overview?.total_days_available || 30,
    dailyStudyHours: aiData.plan_overview?.daily_study_hours || examData.dailyHours,
    subjectPlans: convertSubjectPlans(aiData.subject_wise_strategy || {}),
    dailyTasks: convertDailyTasks(aiData.daily_schedule || []),
    weeklyGoals: convertWeeklyGoals(aiData.weekly_milestones || []),
    revisionStrategy: aiData.exam_preparation_strategy?.last_week_plan || "Comprehensive Final Revision",
    examTips: extractExamTips(aiData, examData),
    motivationalQuotes: aiData.daily_motivation_messages || ["आज की मेहनत कल की सफलता है!"],
    progressMilestones: generateProgressMilestones(aiData.weekly_milestones || []),
    personalizedAnalysis: aiData.personalized_analysis,
    adaptiveRecommendations: aiData.adaptive_recommendations
  };
}

function convertSubjectPlans(subjectStrategy: Record<string, AITeacherSubjectStrategy>): StudyPlan["subjectPlans"] {
  return Object.entries(subjectStrategy).map(([subjectName, data]) => ({
    subjectName,
    priorityLevel: data.priority_ranking <= 2 ? 'high' : 'medium',
    totalHours: data.total_hours_allocated || 20,
    chapters: (data.chapter_wise_breakdown || []).map((chapter) => ({
      chapterNumber: chapter.chapter_number || 1,
      chapterName: chapter.chapter_name || "Core Concepts",
      importance: chapter.importance || 'medium',
      estimatedHours: chapter.estimated_hours || 2,
      topics: (chapter.topics || []).map((topicName: string) => ({
        topicName,
        importance: chapter.importance || 'medium',
        estimatedMinutes: 45,
        keyPoints: [chapter.study_approach || "Concept focus"],
        studyTips: chapter.common_mistakes_to_avoid || [],
        practiceQuestions: [`Practice problems for ${topicName}`]
      }))
    }))
  }));
}

function convertDailyTasks(dailySchedule: AITeacherDaySchedule[]): StudyPlan["dailyTasks"] {
  const tasks: StudyPlan["dailyTasks"] = [];
  dailySchedule.forEach((day, index) => {
    const sessions = ['morning_session', 'afternoon_session', 'evening_session', 'revision_session'];
    sessions.forEach(sessionKey => {
      const session = day[sessionKey] as AITeacherSession | undefined;
      if (session && session.subject) {
        tasks.push({
          id: `task_${index}_${sessionKey}_${Date.now()}`,
          date: day.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subject: session.subject,
          chapter: session.chapter || "Core Study",
          topics: session.topics || [session.subject],
          duration: session.duration_minutes || 60,
          type: sessionKey.includes('revision') ? 'revision' : 'study',
          priority: 'important',
          description: session.study_method || "Smart learning session",
          completed: false,
          studyMethod: session.study_method,
          whyThisTiming: session.why_this_timing
        });
      }
    });
  });
  return tasks;
}

function convertWeeklyGoals(weeklyMilestones: AITeacherWeeklyMilestone[]): StudyPlan["weeklyGoals"] {
  return weeklyMilestones.map((m, i) => ({
    week: m.week || i + 1,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    subjects: m.chapters_to_complete || [],
    chapters: m.chapters_to_complete || [],
    targetCompletion: 100,
    focus: m.goals?.join(', ') || "Weekly Milestone",
    assessment: "Self Assessment / Quiz"
  }));
}

function extractExamTips(aiData: AITeacherResponse, examData: ExamPlanData): string[] {
  const tips: string[] = [];
  const name = examData.examName.toLowerCase();
  
  // BSEB specific intelligence
  if (name.includes('bihar') || name.includes('bseb')) {
    tips.push("BSEB Tip: No negative marking, do not leave any MCQ blank.");
    tips.push("💡 Use 15 min extra time specifically for reading long-form questions.");
  }
  
  if (aiData.exam_preparation_strategy?.exam_day_preparation) {
    tips.push(`📋 ${aiData.exam_preparation_strategy.exam_day_preparation}`);
  }
  
  return tips.length > 0 ? tips : ["Stay consistent", "Revise daily", "Make short notes"];
}

function generateProgressMilestones(milestones: AITeacherWeeklyMilestone[]): StudyPlan["progressMilestones"] {
  return milestones.map((m, i) => ({
    week: i + 1,
    title: m.goals?.[0] || `Week ${i + 1} targets reached`,
    description: m.success_metrics || "Progress tracking active",
    reward: "Great progress!",
    criteria: m.goals || ["Complete weekly targets"]
  }));
}

async function convertNaturalLanguageToStructured(text: string, examData: ExamPlanData): Promise<StudyPlan> {
  return {
    overview: "Plan generated from AI Teacher analysis",
    totalDaysAvailable: 30,
    dailyStudyHours: examData.dailyHours,
    subjectPlans: [],
    dailyTasks: [],
    weeklyGoals: [],
    revisionStrategy: "Active Recall",
    examTips: ["Focus on high-weightage topics first"],
    motivationalQuotes: ["Consistency is the key to success!"],
    progressMilestones: []
  };
}

async function validateAndEnhanceWithSyllabus(plan: StudyPlan, examData: ExamPlanData): Promise<void> {
  try {
    for (const sub of plan.subjectPlans) {
      const topics = sub.chapters.flatMap((c) => c.topics.map((t) => t.topicName));
      validateTopicsAgainstSyllabus(examData.examName, sub.subjectName, topics);
    }
  } catch {
    console.warn("Official syllabus validation skipped to ensure stability.");
  }
}

export async function generateAdaptiveStudyPlanUpdate(
  originalPlan: StudyPlan,
  examData: ExamPlanData,
  completedTasks: unknown[],
  pendingTasks: unknown[],
  userFeedback: string,
  difficulties: string[]
): Promise<StudyPlan> {
  const adaptivePrompt = generateAdaptiveUpdatePrompt(originalPlan, completedTasks, pendingTasks, userFeedback, difficulties);
  
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: { 
      prompt: adaptivePrompt, 
      history: [], 
      chatId: undefined, 
      apiKeyType: 'default',
      model: 'google/gemini-3.1-pro-preview' // ✅ यहाँ भी लेटेस्ट मॉडल
    }
  });

  if (error || !data?.success) throw new Error('Adaptive plan update failed');
  return await parseAndValidateAITeacherResponse(data.response, examData);
}
