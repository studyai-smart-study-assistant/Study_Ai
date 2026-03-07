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
 * Study AI - Enhanced Study Plan Generator
 * Developed by Ajit Kumar
 */

export async function generateEnhancedStudyPlan(
  examData: ExamPlanData,
  options: EnhancedGenerationOptions = {}
): Promise<StudyPlan> {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`🧠 Study AI Teacher: Generating personalized plan. Attempt ${retryCount + 1}`);
      
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
      if (!data?.success) throw new Error(data?.error || "AI service failed to respond");

      const responseText = data.response;
      
      // Parse and validate with a focus on safety for live site
      const studyPlan = await parseAndValidateAITeacherResponse(responseText, examData);
      
      if (options.includeSyllabusValidation) {
        await validateAndEnhanceWithSyllabus(studyPlan, examData);
      }
      
      toast.success("आपका स्मार्ट स्टडी प्लान तैयार है! चलिए जीत की तैयारी शुरू करते हैं।");
      return studyPlan;
      
    } catch (error: any) {
      console.error(`❌ Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (retryCount <= maxRetries) {
        const waitTime = 2000;
        toast.info("AI Teacher आपके लिए बेहतरीन नोट्स और प्लान तैयार कर रहा है, थोड़ा और समय लग रहा है...");
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      const errorMessage = error.message?.includes('rate limit') 
        ? "AI सर्विस अभी बिजी है, कृपया 1 मिनट बाद कोशिश करें।"
        : "स्टडी प्लान बनाने में समस्या आई। कृपया अपना इंटरनेट चेक करें।";
        
      toast.error(errorMessage, {
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
      
      throw error;
    }
  }
  
  throw new Error("Maximum retry attempts exceeded");
}

async function parseAndValidateAITeacherResponse(responseText: string, examData: ExamPlanData): Promise<StudyPlan> {
  try {
    let parsedData;
    
    // Safety check to extract JSON even if AI adds conversational text
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
      parsedData = JSON.parse(jsonString);
    } else {
      throw new Error('No valid JSON structure found');
    }
    
    return convertAITeacherJSONToStudyPlan(parsedData, examData);
    
  } catch (error) {
    console.warn('JSON parsing failed, falling back to natural language extraction');
    return await convertNaturalLanguageToStructured(responseText, examData);
  }
}

function convertAITeacherJSONToStudyPlan(aiData: any, examData: ExamPlanData): StudyPlan {
  return {
    overview: aiData.plan_overview?.exam_strategy || `Specialized strategy for ${examData.examName}`,
    totalDaysAvailable: aiData.plan_overview?.total_days_available || 30,
    dailyStudyHours: aiData.plan_overview?.daily_study_hours || examData.dailyHours,
    subjectPlans: convertSubjectPlans(aiData.subject_wise_strategy || {}),
    dailyTasks: convertDailyTasks(aiData.daily_schedule || []),
    weeklyGoals: convertWeeklyGoals(aiData.weekly_milestones || []),
    revisionStrategy: aiData.exam_preparation_strategy?.last_week_plan || 'Final week focused revision',
    examTips: extractExamTips(aiData, examData),
    motivationalQuotes: aiData.daily_motivation_messages || generateDefaultMotivation(),
    progressMilestones: generateProgressMilestones(aiData.weekly_milestones || []),
    personalizedAnalysis: aiData.personalized_analysis,
    adaptiveRecommendations: aiData.adaptive_recommendations
  };
}

function convertSubjectPlans(subjectStrategy: any): any[] {
  return Object.entries(subjectStrategy).map(([subjectName, data]: [string, any]) => ({
    subjectName,
    priorityLevel: data.priority_ranking <= 2 ? 'high' : data.priority_ranking <= 4 ? 'medium' : 'low',
    totalHours: data.total_hours_allocated || 20,
    chapters: (data.chapter_wise_breakdown || []).map((chapter: any) => ({
      chapterNumber: chapter.chapter_number || 1,
      chapterName: chapter.chapter_name,
      importance: chapter.importance || 'medium',
      estimatedHours: chapter.estimated_hours || 2,
      topics: (chapter.topics || []).map((topicName: string) => ({
        topicName,
        importance: chapter.importance || 'medium',
        estimatedMinutes: Math.floor((chapter.estimated_hours || 2) * 60 / (chapter.topics?.length || 1)),
        keyPoints: [chapter.study_approach || 'Key concept focus'],
        studyTips: chapter.common_mistakes_to_avoid || [],
        practiceQuestions: [`Practice problems for ${topicName}`]
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
          chapter: session.chapter || 'Chapter Focus',
          topics: session.topics || [session.subject],
          duration: session.duration_minutes || 60,
          type: sessionKey.includes('revision') ? 'revision' : 'study',
          priority: session.importance_level === 'High' ? 'urgent' : 'important',
          description: session.study_method || `Study session for ${session.subject}`,
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
  return weeklyMilestones.map((milestone, index) => ({
    week: milestone.week || index + 1,
    subjects: milestone.chapters_to_complete?.map((ch: string) => ch.split(' - ')[0]) || ['General'],
    chapters: milestone.chapters_to_complete || [],
    targetCompletion: 100,
    focus: milestone.goals?.join(', ') || 'Complete assigned chapters',
    assessmentMethod: milestone.assessment_method || 'Practice Test',
    successMetrics: milestone.success_metrics || 'Accuracy > 80%'
  }));
}

function extractExamTips(aiData: any, examData: ExamPlanData): string[] {
  const tips: string[] = [];
  
  // Specific intelligence for Bihar Board
  if (examData.examName.toLowerCase().includes('bihar') || examData.examName.toLowerCase().includes('bseb')) {
    tips.push("💡 BSEB Tip: 15 मिनट का एक्स्ट्रा समय केवल लॉन्ग आंसर वाले सवालों को चुनने में बिताएं।");
    tips.push("💡 No Negative Marking: एक भी ऑब्जेक्टिव सवाल खाली न छोड़ें।");
  }

  if (aiData.exam_preparation_strategy?.stress_management) {
    tips.push(`🧘 ${aiData.exam_preparation_strategy.stress_management}`);
  }
  
  if (aiData.adaptive_recommendations?.motivation_boosters) {
    aiData.adaptive_recommendations.motivation_boosters.forEach((tip: string) => tips.push(`💪 ${tip}`));
  }
  
  return tips.length > 0 ? tips : [
    '📝 नियमित रूप से रिवीजन करें।',
    '⏰ समय का सही प्रबंधन ही सफलता की कुंजी है।',
    '🔄 पुराने पेपर्स सॉल्व
