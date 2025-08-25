
export interface ExamPlanData {
  // Basic Information
  examName: string;
  examDate: string;
  subjects: string[];
  class: string; // Added missing property
  customSubjects?: string[]; // Added missing property
  dailyHours: number; // Added missing property
  
  // Personal Assessment
  currentStatus: string;
  currentStudyStatus?: string; // Added alias for compatibility
  studyTimeSlots: string[];
  weakAreas: string;
  strongAreas: string;
  
  // Study Preferences
  difficultyLevel: 'basic' | 'medium' | 'advanced';
  explanationStyle: 'detailed' | 'concise' | 'exam-focused';
  learningStyle: 'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing'; // Added missing property
  includeExamples: boolean;
  includePractice: boolean;
  includeRevision: boolean;
  includeMotivation: boolean;
}

export interface ChapterInfo {
  chapterNumber: number;
  chapterName: string;
  importance: 'high' | 'medium' | 'low';
  estimatedHours: number;
  topics: TopicInfo[];
  practiceQuestions: number;
  revisionTips?: string[];
  examStrategy?: string[];
  commonMistakes?: string[];
}

export interface TopicInfo {
  topicName: string;
  importance: 'critical' | 'important' | 'moderate';
  estimatedMinutes: number;
  description: string;
  keyPoints: string[];
  whatToStudy?: string[];
  howToStudy?: string[];
  practiceQuestions?: string[];
  memoryTricks?: string[];
  studyTips?: string[];
}

export interface SubjectPlan {
  subjectName: string;
  totalChapters: number;
  priorityLevel: 'high' | 'medium' | 'low';
  chapters: ChapterInfo[];
  overallStrategy: string;
  revisionSchedule: RevisionSlot[];
}

export interface DailyTask {
  id: string;
  date: string;
  day?: string; // Added for day-based filtering
  subject: string;
  chapter: string;
  topic: string;
  topics?: string[]; // Added for compatibility
  duration: number | string; // Changed to support both number and string
  type: 'study' | 'revision' | 'practice' | 'test';
  taskType?: 'study' | 'revision' | 'practice' | 'test'; // Added alias
  priority: 'urgent' | 'important' | 'normal' | 'उच्च' | 'मध्यम' | 'सामान्य'; // Added Hindi priorities
  description: string;
  detailedInstructions?: string[];
  completed: boolean;
  completedAt?: number;
  score?: number;
  progressInput?: string;
  studentFeedback?: string;
  difficultyRating?: number;
  timeSpent?: number;
  difficulty?: 'easy' | 'medium' | 'hard'; // Added for compatibility
}

export interface RevisionSlot {
  week: number;
  chapters: string[];
  focus: string;
  duration: number;
  specificTasks?: string[];
}

export interface StudyPlan {
  overview: string;
  totalDaysAvailable: number;
  dailyStudyHours: number;
  subjectPlans: SubjectPlan[];
  dailyTasks: DailyTask[];
  dailySchedule?: DailyTask[]; // Added for compatibility
  weeklyGoals: WeeklyGoal[];
  revisionStrategy: string;
  examTips: string[];
  motivationalQuotes: string[];
  progressMilestones: Milestone[];
  personalizedAnalysis?: any; // Added missing property
  adaptiveRecommendations?: any; // Added missing property
}

export interface WeeklyGoal {
  week: number;
  startDate: string;
  endDate: string;
  subjects: string[];
  chapters: string[];
  targetCompletion: number; // percentage
  focus: string;
  assessment: string;
  detailedTargets?: string[];
  studySchedule?: string[];
}

export interface Milestone {
  week: number;
  title: string;
  description: string;
  reward: string;
  criteria: string[];
}

export interface UserProgress {
  userId: string;
  examPlanId: string;
  totalTasksCompleted: number;
  totalTasksAssigned: number;
  currentStreak: number;
  totalPoints: number;
  badges: Badge[];
  lastActivityDate: string;
  weeklyProgress: WeekProgress[];
  studentFeedbacks: StudentFeedback[];
}

export interface WeekProgress {
  week: number;
  tasksCompleted: number;
  tasksAssigned: number;
  pointsEarned: number;
  averageScore: number;
  averageDifficulty?: number;
  totalTimeSpent?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

export interface StudentFeedback {
  taskId: string;
  date: string;
  subject: string;
  chapter: string;
  topic: string;
  feedback: string;
  difficultyRating: number;
  timeSpent: number;
  completed: boolean;
  submittedAt: number;
}
