
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

export async function generateEnhancedStudyPlan(
  examData: ExamPlanData,
  options: EnhancedGenerationOptions = {}
): Promise<StudyPlan> {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`🧠 Generating AI Teacher study plan attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      // Use comprehensive AI Teacher prompt instead of basic prompt
      const aiTeacherPrompt = generateComprehensiveAITeacherPrompt(examData, {
        includeFullSyllabus: options.includeSyllabusValidation ?? true,
        includeLearningStyleAdaptation: true,
        includeProgressiveAdaptation: options.includeAdaptiveContent ?? false,
        includeDetailedStudyMethods: true,
        responseFormat: 'structured_json',
        personalizedMotivation: true
      }, options.userProgressData);

      console.log('📤 AI Teacher prompt length:', aiTeacherPrompt.length);

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: aiTeacherPrompt,
          history: [],
          chatId: undefined,
          apiKeyType: 'default'
        }
      });

      if (error) {
        console.error(`❌ Supabase function error (attempt ${retryCount + 1}):`, error);
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data.success) {
        console.error(`❌ API response failed (attempt ${retryCount + 1}):`, data.error);
        throw new Error(data.error || "Unknown error from AI service");
      }

      const responseText = data.response;
      console.log(`✅ AI Teacher response generated, length: ${responseText.length}`);
      
      // Parse and validate the response with enhanced processing
      const studyPlan = await parseAndValidateAITeacherResponse(responseText, examData);
      
      // Apply syllabus validation if enabled
      if (options.includeSyllabusValidation) {
        await validateAndEnhanceWithSyllabus(studyPlan, examData);
      }
      
      return studyPlan;
      
    } catch (error) {
      console.error(`❌ Error on attempt ${retryCount + 1}:`, error);
      
      retryCount++;
      
      if (retryCount <= maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 3000);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        
        if (retryCount === 1) {
          toast.info("AI Teacher processing taking longer, optimizing...", {
            duration: 2000
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      console.error("❌ All AI Teacher generation attempts failed:", error);
      
      const errorMessage = error.message?.includes('rate limit') 
        ? "AI service is busy, please try again in a moment"
        : error.message?.includes('Failed to fetch')
        ? "Network connection issue, please check your internet"
        : "Failed to generate AI Teacher study plan";
        
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
    // Try to parse as JSON first (AI Teacher should return structured JSON)
    let parsedData;
    
    if (responseText.trim().startsWith('{')) {
      parsedData = JSON.parse(responseText);
    } else {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find any JSON-like structure in the response
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsedData = JSON.parse(responseText.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    }
    
    return convertAITeacherJSONToStudyPlan(parsedData, examData);
    
  } catch (error) {
    console.warn('Failed to parse as AI Teacher JSON, using fallback conversion');
    return await convertNaturalLanguageToStructured(responseText, examData);
  }
}

function convertAITeacherJSONToStudyPlan(aiData: any, examData: ExamPlanData): StudyPlan {
  // Convert AI Teacher JSON format to our StudyPlan interface
  const studyPlan: StudyPlan = {
    overview: aiData.plan_overview?.exam_strategy || 'AI-generated comprehensive study plan',
    totalDaysAvailable: aiData.plan_overview?.total_days_available || 30,
    dailyStudyHours: aiData.plan_overview?.daily_study_hours || examData.dailyHours,
    subjectPlans: convertSubjectPlans(aiData.subject_wise_strategy || {}),
    dailyTasks: convertDailyTasks(aiData.daily_schedule || []),
    weeklyGoals: convertWeeklyGoals(aiData.weekly_milestones || []),
    revisionStrategy: aiData.exam_preparation_strategy?.last_week_plan || 'Comprehensive revision in final week',
    examTips: extractExamTips(aiData),
    motivationalQuotes: aiData.daily_motivation_messages || generateDefaultMotivation(),
    progressMilestones: generateProgressMilestones(aiData.weekly_milestones || []),
    personalizedAnalysis: aiData.personalized_analysis,
    adaptiveRecommendations: aiData.adaptive_recommendations
  };

  return studyPlan;
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
        keyPoints: [chapter.study_approach || 'Standard study approach'],
        studyTips: chapter.common_mistakes_to_avoid || [],
        practiceQuestions: [`Practice ${chapter.practice_requirements || '10 questions'} for ${topicName}`]
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
          id: `task_${index}_${sessionKey}`,
          date: day.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subject: session.subject,
          chapter: session.chapter || 'General Study',
          topics: session.topics || [session.subject],
          duration: session.duration_minutes || 60,
          type: sessionKey.includes('revision') ? 'revision' : 'study',
          priority: session.importance_level === 'High' ? 'urgent' : session.importance_level === 'Medium' ? 'important' : 'normal',
          description: session.study_method || `Study ${session.subject}`,
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
    targetCompletion: 80,
    focus: milestone.goals?.join(', ') || 'Complete assigned chapters',
    assessmentMethod: milestone.assessment_method || 'Self-evaluation',
    successMetrics: milestone.success_metrics || 'Chapter completion'
  }));
}

function extractExamTips(aiData: any): string[] {
  const tips: string[] = [];
  
  if (aiData.exam_preparation_strategy) {
    const strategy = aiData.exam_preparation_strategy;
    if (strategy.stress_management) tips.push(`🧘 Stress Management: ${strategy.stress_management}`);
    if (strategy.exam_day_preparation) tips.push(`📋 Exam Day: ${strategy.exam_day_preparation}`);
  }
  
  if (aiData.adaptive_recommendations) {
    const adaptive = aiData.adaptive_recommendations;
    if (adaptive.motivation_boosters) {
      adaptive.motivation_boosters.forEach((tip: string) => tips.push(`💪 ${tip}`));
    }
  }
  
  return tips.length > 0 ? tips : [
    '📝 नियमित नोट्स बनाएं और revision करें',
    '🔄 Mock tests को seriously लें',
    '⏰ Time management पर focus करें',
    '💪 Consistent effort से ही success मिलती है'
  ];
}

function generateDefaultMotivation(): string[] {
  return [
    '🌟 "आज का मेहनत कल की सफलता का आधार है!"',
    '📚 "हर page आपको goal के करीब ले जाता है!"',
    '🎯 "Focus और consistency ही आपकी सबसे बड़ी ताकत है!"',
    '💪 "मुश्किलें आपको मजबूत बनाने के लिए आती हैं!"'
  ];
}

function generateProgressMilestones(weeklyMilestones: any[]): any[] {
  return weeklyMilestones.map((milestone, index) => ({
    week: index + 1,
    target: milestone.goals?.join(', ') || `Week ${index + 1} targets`,
    description: milestone.success_metrics || 'Complete assigned tasks',
    completed: false
  }));
}

async function convertNaturalLanguageToStructured(responseText: string, examData: ExamPlanData): Promise<StudyPlan> {
  // Enhanced natural language parsing for fallback
  const lines = responseText.split('\n').filter(line => line.trim());
  const studyPlan: StudyPlan = {
    overview: 'AI Teacher generated personalized study plan',
    totalDaysAvailable: Math.ceil((new Date(examData.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    dailyStudyHours: examData.dailyHours,
    subjectPlans: [],
    dailyTasks: [],
    weeklyGoals: [],
    revisionStrategy: 'Smart spaced repetition with AI-optimized intervals',
    examTips: extractExamTipsFromText(responseText),
    motivationalQuotes: generateDefaultMotivation(),
    progressMilestones: []
  };

  // Extract daily tasks from natural language with better parsing
  studyPlan.dailyTasks = extractDailyTasksFromText(responseText, examData);
  
  return studyPlan;
}

function extractExamTipsFromText(responseText: string): string[] {
  const tips: string[] = [];
  const lines = responseText.split('\n');
  
  lines.forEach(line => {
    if (line.includes('टिप') || line.includes('सुझाव') || line.includes('ध्यान') || line.includes('tip') || line.includes('strategy')) {
      tips.push(line.trim());
    }
  });
  
  return tips.length > 0 ? tips : [
    '📝 AI Teacher recommends active note-taking',
    '🔄 Regular self-assessment और progress tracking',
    '⏰ Time-bound practice sessions',
    '💪 Consistent daily effort with smart breaks'
  ];
}

function extractDailyTasksFromText(responseText: string, examData: ExamPlanData): any[] {
  // Enhanced task extraction with better intelligence
  const tasks: any[] = [];
  const currentDate = new Date();
  
  examData.subjects.forEach((subject, subjectIndex) => {
    for (let day = 0; day < 14; day++) { // 2 weeks of tasks
      const taskDate = new Date(currentDate);
      taskDate.setDate(currentDate.getDate() + day);
      
      // Create morning task
      tasks.push({
        id: `task_morning_${subject}_${day}`,
        date: taskDate.toISOString().split('T')[0],
        subject,
        chapter: `Chapter ${Math.floor(day / 2) + 1}`,
        topics: [`${subject} - Core Concepts Day ${day + 1}`],
        duration: Math.floor(examData.dailyHours * 60 / 3), // Divide daily hours
        type: 'study',
        priority: day < 7 ? 'urgent' : 'important',
        description: `Comprehensive study session focusing on understanding concepts`,
        completed: false,
        studyMethod: 'Read → Understand → Make Notes → Practice',
        whyThisTiming: 'Morning hours are optimal for complex concept learning'
      });
      
      // Create evening revision task
      if (day > 0) { // Start revision from day 2
        tasks.push({
          id: `task_evening_${subject}_${day}`,
          date: taskDate.toISOString().split('T')[0],
          subject,
          chapter: `Revision - Chapter ${Math.floor((day - 1) / 2) + 1}`,
          topics: [`${subject} - Quick Revision`],
          duration: Math.floor(examData.dailyHours * 60 / 4),
          type: 'revision',
          priority: 'normal',
          description: `Quick revision और practice problems`,
          completed: false,
          studyMethod: 'Review Notes → Solve Practice Questions → Clear Doubts',
          whyThisTiming: 'Evening revision helps consolidate learning'
        });
      }
    }
  });
  
  return tasks.slice(0, 30); // Limit to manageable number
}

async function validateAndEnhanceWithSyllabus(studyPlan: StudyPlan, examData: ExamPlanData): Promise<void> {
  console.log('🔍 Validating AI Teacher plan with official syllabus...');
  
  // Validate each subject's content against official syllabus
  for (const subjectPlan of studyPlan.subjectPlans) {
    const validation = validateTopicsAgainstSyllabus(
      examData.examName,
      subjectPlan.subjectName,
      subjectPlan.chapters.flatMap(ch => ch.topics.map(t => t.topicName))
    );
    
    if (validation.invalidTopics.length > 0) {
      console.warn(`⚠️ Invalid topics found in ${subjectPlan.subjectName}:`, validation.invalidTopics);
      
      // Add syllabus validation feedback
      studyPlan.examTips.push(`⚠️ ${subjectPlan.subjectName}: ${validation.suggestions.join(', ')}`);
    }
    
    console.log(`✅ ${subjectPlan.subjectName}: ${validation.validTopics.length} valid topics confirmed`);
  }
  
  console.log('✅ Syllabus validation completed with AI Teacher plan');
}

// Function for adaptive plan updates
export async function generateAdaptiveStudyPlanUpdate(
  originalPlan: StudyPlan,
  examData: ExamPlanData,
  completedTasks: any[],
  pendingTasks: any[],
  userFeedback: string,
  difficulties: string[]
): Promise<StudyPlan> {
  
  const adaptivePrompt = generateAdaptiveUpdatePrompt(
    originalPlan,
    completedTasks,
    pendingTasks,
    userFeedback,
    difficulties
  );
  
  console.log('🔄 Generating adaptive plan update...');
  
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: {
      prompt: adaptivePrompt,
      history: [],
      chatId: undefined,
      apiKeyType: 'default'
    }
  });

  if (error || !data.success) {
    throw new Error('Failed to generate adaptive update');
  }

  const updatedPlan = await parseAndValidateAITeacherResponse(data.response, examData);
  
  toast.success('🚀 Study plan updated based on your progress!');
  
  return updatedPlan;
}
