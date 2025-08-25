
import { ExamPlanData } from '@/components/study/examplanner/types';
import { getSyllabusForExam, getSubjectSyllabus } from '@/data/syllabus/syllabusDatabase';

export interface AITeacherPromptConfig {
  includeFullSyllabus: boolean;
  includeLearningStyleAdaptation: boolean;
  includeProgressiveAdaptation: boolean;
  includeDetailedStudyMethods: boolean;
  responseFormat: 'structured_json' | 'conversational';
  personalizedMotivation: boolean;
}

export const generateComprehensiveAITeacherPrompt = (
  examData: ExamPlanData,
  config: AITeacherPromptConfig = {
    includeFullSyllabus: true,
    includeLearningStyleAdaptation: true,
    includeProgressiveAdaptation: true,
    includeDetailedStudyMethods: true,
    responseFormat: 'structured_json',
    personalizedMotivation: true
  },
  userProgress?: any
): string => {

  // Get comprehensive syllabus data
  const examSyllabus = getSyllabusForExam(examData.examName);
  const syllabusData = examData.subjects.map(subject => 
    getSubjectSyllabus(examData.examName, subject)
  ).filter(Boolean);

  // Calculate days available
  const daysAvailable = Math.ceil(
    (new Date(examData.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const basePrompt = `
आप एक अत्यधिक कुशल और अनुभवी AI टीचर/मेंटर हैं। मेरा नाम अजित है। मुझे मेरी आगामी **${examData.examName}** परीक्षा (जो **${examData.examDate}** तक है, यानी ${daysAvailable} दिन बचे हैं) के लिए एक विस्तृत, पर्सनलाइज़्ड और कार्य-उन्मुख अध्ययन योजना बनाने में मदद करें।

**मेरी परीक्षा और विषय संबंधी जानकारी:**
- परीक्षा का नाम: ${examData.examName}
- कक्षा/स्तर: ${examData.class || 'Not specified'}
- अध्ययन करने वाले विषय: ${examData.subjects.join(', ')}
${examData.customSubjects && examData.customSubjects.length > 0 ? `- अतिरिक्त विषय: ${examData.customSubjects.join(', ')}` : ''}

**मेरी वर्तमान अध्ययन स्थिति और व्यक्तिगत प्राथमिकताएं:**
- वर्तमान समग्र अध्ययन स्थिति: ${examData.currentStatus}
- मेरे कमजोर क्षेत्र हैं: ${examData.weakAreas} (कृपया इन विषयों पर **40% अधिक समय** और विशेष attention दें)
- मेरे मजबूत क्षेत्र हैं: ${examData.strongAreas} (इनके लिए smart revision और advanced practice दें)
- मेरा पसंदीदा कठिनाई स्तर: ${examData.difficultyLevel}
- मेरा पसंदीदा व्याख्या/अध्ययन शैली: ${examData.explanationStyle}
- मेरी मुख्य सीखने की शैली है: ${examData.learningStyle}

**मेरे दैनिक अध्ययन की उपलब्धता:**
- मैं प्रतिदिन कुल **${examData.dailyHours} घंटे** अध्ययन कर सकता हूँ
- मेरे पसंदीदा अध्ययन समय स्लॉट हैं: ${examData.studyTimeSlots?.join(', ') || 'Flexible'}

${config.includeFullSyllabus && examSyllabus ? generateSyllabusSection(examSyllabus, examData.subjects) : ''}

${config.includeLearningStyleAdaptation ? generateLearningStyleSection(examData) : ''}

${config.includeDetailedStudyMethods ? generateStudyMethodsSection(examData) : ''}

${userProgress ? generateProgressAdaptationSection(userProgress) : ''}

**मुझे निम्नलिखित विवरणों के साथ एक संरचित और गतिशील अध्ययन योजना चाहिए:**

1. **व्यक्तिगत प्रोफाइल विश्लेषण:**
   - मेरी learning style के अनुसार सबसे प्रभावी अध्ययन methods
   - कमजोर areas के लिए विशेष strategies
   - Time slots के अनुसार optimal subject allocation

2. **दैनिक विस्तृत कार्य सूची (Daily Task Breakdown):**
   - प्रत्येक दिन के लिए hour-by-hour schedule
   - प्रत्येक task के लिए exact time allocation (minutes में)
   - **'कैसे पढ़ना है' मार्गदर्शन:** हर topic के लिए step-by-step study method
   - Priority levels (High/Medium/Low) with reasons
   - Break patterns और rest periods

3. **विषय-वार गहरा विश्लेषण:**
   - प्रत्येक subject की priority ranking
   - Chapter-wise importance और weightage
   - Topic-wise difficulty analysis
   - समय आवंटन का scientific distribution

4. **अनुकूली प्रगति ट्रैकिंग:**
   - Weekly milestones और targets
   - Daily self-assessment questions
   - Progress adjustment indicators
   - Motivational checkpoints

5. **परीक्षा रणनीति और तैयारी:**
   - Last-minute revision strategy
   - Mock test schedule
   - Stress management techniques
   - Exam day preparation

${config.responseFormat === 'structured_json' ? generateJSONFormatInstructions() : ''}

${config.personalizedMotivation ? generateMotivationalSection(examData) : ''}

**महत्वपूर्ण निर्देश:**
- सभी सुझाए गए topics और chapters **वास्तव में ${examData.examName} के official syllabus में मौजूद** होने चाहिए
- योजना को मेरी दी गई सभी personal preferences के अनुसार पूरी तरह customize करें
- प्रत्येक दिन realistic और achievable targets रखें
- Study methods को मेरी learning style के अनुकूल बनाएं
- कमजोर areas पर विशेष focus के साथ balanced approach अपनाएं

कृपया एक comprehensive, personalized और immediately actionable study plan बनाएं जो मुझे systematic तरीके से success की ओर ले जाए।
`;

  return basePrompt.trim();
};

const generateSyllabusSection = (examSyllabus: any, subjects: string[]): string => {
  let syllabusSection = `\n**${examSyllabus.examName} का आधिकारिक पाठ्यक्रम (Official Syllabus):**\n`;
  syllabusSection += `परीक्षा पैटर्न: ${examSyllabus.examPattern.totalMarks} अंक, ${examSyllabus.examPattern.duration}, ${examSyllabus.examPattern.markingScheme}\n\n`;

  subjects.forEach(subject => {
    const subjectData = examSyllabus.subjects[subject];
    if (subjectData) {
      syllabusSection += `**${subject} (${subjectData.totalMarks} अंक):**\n`;
      subjectData.chapters.forEach((chapter: any) => {
        syllabusSection += `- अध्याय ${chapter.chapterNumber}: ${chapter.chapterName}\n`;
        syllabusSection += `  विषय: ${chapter.topics.join(', ')}\n`;
        syllabusSection += `  महत्व: ${chapter.importance}, वेटेज: ${chapter.weightage}%, कठिनाई: ${chapter.difficulty}\n`;
      });
      syllabusSection += '\n';
    }
  });

  syllabusSection += 'कृपया केवल इसी syllabus के अनुसार study plan बनाएं।\n';
  return syllabusSection;
};

const generateLearningStyleSection = (examData: ExamPlanData): string => {
  const styleGuide: { [key: string]: string } = {
    'Visual': 'Mind maps, diagrams, flowcharts, color-coded notes, visual aids का अधिक उपयोग करें',
    'Auditory': 'Audio lectures, discussion, verbal repetition, recorded notes का उपयोग करें',
    'Kinesthetic': 'Hands-on practice, physical movement while studying, writing notes का उपयोग करें',
    'Reading/Writing': 'Detailed notes, text-based materials, written summaries का उपयोग करें'
  };

  return `\n**Learning Style Adaptation (${examData.learningStyle}):**\n${styleGuide[examData.learningStyle] || 'Multimodal approach अपनाएं'}\n`;
};

const generateStudyMethodsSection = (examData: ExamPlanData): string => {
  return `\n**विस्तृत अध्ययन विधियाँ शामिल करें:**\n
- प्रत्येक topic के लिए step-by-step reading sequence
- Note-making techniques specific to subject
- Practice problem solving approach  
- Memory retention techniques
- Quick revision methods
- Self-testing strategies\n`;
};

const generateProgressAdaptationSection = (userProgress: any): string => {
  return `\n**प्रगति के आधार पर अनुकूलन:**\n
पिछली प्रगति: ${JSON.stringify(userProgress, null, 2)}
इस data के आधार पर plan को adjust करें और areas of improvement suggest करें।\n`;
};

const generateJSONFormatInstructions = (): string => {
  return `\n**आउटपुट Format (JSON):**\n
कृपया response को निम्नलिखित JSON structure में दें:
{
  "plan_overview": {
    "total_days_available": number,
    "daily_study_hours": number,
    "exam_strategy": "string",
    "success_probability": "percentage"
  },
  "personalized_analysis": {
    "learning_style_optimization": "string",
    "weak_areas_strategy": "string", 
    "strong_areas_maintenance": "string",
    "time_slot_optimization": "string"
  },
  "daily_schedule": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "total_study_hours": number,
      "morning_session": {
        "time_slot": "9:00 AM - 11:00 AM",
        "subject": "string",
        "chapter": "string",
        "topics": ["topic1", "topic2"],
        "study_method": "detailed step-by-step method",
        "duration_minutes": number,
        "importance_level": "High/Medium/Low",
        "why_this_timing": "reason for optimal timing"
      },
      "afternoon_session": { /* similar structure */ },
      "evening_session": { /* similar structure */ },
      "revision_session": { /* similar structure */ },
      "daily_target": "specific achievement goal",
      "self_assessment_questions": ["question1", "question2"],
      "motivational_note": "personalized motivation"
    }
  ],
  "subject_wise_strategy": {
    "subject_name": {
      "total_hours_allocated": number,
      "priority_ranking": number,
      "chapter_wise_breakdown": [
        {
          "chapter_name": "string",
          "topics": ["topic1", "topic2"],
          "estimated_hours": number,
          "difficulty_level": "Easy/Medium/Hard",
          "importance": "High/Medium/Low",
          "study_approach": "detailed method",
          "practice_requirements": "number of problems/questions",
          "common_mistakes_to_avoid": ["mistake1", "mistake2"]
        }
      ]
    }
  },
  "weekly_milestones": [
    {
      "week": number,
      "goals": ["goal1", "goal2"],
      "chapters_to_complete": ["chapter1", "chapter2"],
      "assessment_method": "mock test/self-evaluation",
      "success_metrics": "measurable targets"
    }
  ],
  "exam_preparation_strategy": {
    "last_week_plan": "detailed revision strategy",
    "mock_test_schedule": ["date1", "date2"],
    "stress_management": "techniques and tips",
    "exam_day_preparation": "step-by-step guide"
  },
  "adaptive_recommendations": {
    "if_ahead_of_schedule": "action plan",
    "if_behind_schedule": "catch-up strategy", 
    "difficulty_encountered": "support methods",
    "motivation_boosters": ["tip1", "tip2"]
  },
  "daily_motivation_messages": [
    "Day 1: motivational message",
    "Day 2: motivational message"
  ]
}\n`;
};

const generateMotivationalSection = (examData: ExamPlanData): string => {
  return `\n**व्यक्तिगत प्रेरणा और मानसिक तैयारी:**\n
- Daily motivational quotes और success mantras
- Progress celebration milestones  
- Stress management techniques
- Confidence building exercises
- Success visualization practices
- Peer comparison avoidance strategies\n`;
};

// Function to generate adaptive prompts for progress updates
export const generateAdaptiveUpdatePrompt = (
  originalPlan: any,
  completedTasks: any[],
  pendingTasks: any[],
  userFeedback: string,
  difficultiesEncountered: string[]
): string => {
  return `
मैं अपनी study plan को update करना चाहता हूँ। यहाँ मेरी current progress है:

**Completed Tasks:**
${completedTasks.map(task => `✅ ${task.subject} - ${task.topic} (${task.completionTime} में पूरा)`).join('\n')}

**Pending Tasks:**
${pendingTasks.map(task => `❌ ${task.subject} - ${task.topic} (Planned for ${task.plannedDate})`).join('\n')}

**मेरी Feedback:**
"${userFeedback}"

**कठिनाइयाँ जिनका सामना हुआ:**
${difficultiesEncountered.join(', ')}

कृपया मेरी remaining study plan को इस progress के आधार पर optimize करें। विशेष रूप से:
1. Pending tasks को realistic तरीके से reschedule करें
2. जिन topics में difficulty आई है उनके लिए alternative study methods suggest करें  
3. Time allocation को current pace के अनुसार adjust करें
4. Motivational support और encouragement दें

Updated plan JSON format में दें।
`;
};
