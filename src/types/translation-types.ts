
export type Language = 'en' | 'hi';

export interface TranslationKeys {
  // Common translations
  advancedStudyTools: string;
  personalizedTools: string;
  language: string;
  english: string;
  hindi: string;
  quizGenerator: string;
  notesGenerator: string;
  studyPlanner: string;
  homeworkAssistant: string;
  motivationSystem: string;
  teacherMode: string;
  generateQuiz: string;
  generateNotes: string;
  planStudy: string;
  assistHomework: string;
  motivate: string;
  generateTeaching: string;
  about: string;
  aboutStudyAI: string;
  
  // Authentication translations
  welcomeBack: string;
  signInToContinue: string;
  createAccount: string;
  joinStudyAI: string;
  email: string;
  password: string;
  createPassword: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  sendResetLink: string;
  backToSignIn: string;
  signIn: string;
  signUp: string;
  signingIn: string;
  creatingAccount: string;
  sending: string;
  sendAgain: string;
  fullName: string;
  iAmA: string;
  educationLevel: string;
  selectCategory: string;
  selectEducationLevel: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  passwordsDoNotMatch: string;
  passwordTooShort: string;
  fillAllFields: string;
  enterEmailAndPassword: string;
  loginSuccessful: string;
  accountCreated: string;
  
  // Student Activities Tab Names
  timer: string;
  progress: string;
  goals: string;
  tasks: string;
  leaderboard: string;
  planner: string;
  
  // Daily Streak
  dailyStreak: string;
  dayStreak: string;
  keepTheStreak: string;
  loginTomorrow: string;
  streakBonus: string;
  
  // QuizGenerator translations
  quizDescription: string;
  topic: string;
  topicPlaceholder: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  numberOfQuestions: string;
  processing: string;
  
  // NotesGenerator translations
  notesDescription: string;
  noteFormat: string;
  concise: string;
  comprehensive: string;
  examFocused: string;
  
  // StudyPlanner translations
  plannerDescription: string;
  examName: string;
  examNamePlaceholder: string;
  examDate: string;
  subjects: string;
  subjectsPlaceholder: string;
  hoursAvailable: string;
  hour: string;
  hours: string;
  plusHours: string;
  generatePlan: string;
  
  // HomeworkAssistant translations
  homeworkDescription: string;
  subject: string;
  mathematics: string;
  physics: string;
  chemistry: string;
  biology: string;
  history: string;
  geography: string;
  computerScience: string;
  literature: string;
  economics: string;
  psychology: string;
  sociology: string;
  yourProblem: string;
  problemPlaceholder: string;
  helpType: string;
  stepByStep: string;
  justHint: string;
  checkWork: string;
  getHelp: string;
  
  // MotivationSystem translations
  motivationDescription: string;
  studyMotivation: string;
  motivationDescription1: string;
  examPreparation: string;
  motivationDescription2: string;
  overcomeProcrastination: string;
  motivationDescription3: string;
  dailyAffirmations: string;
  motivationDescription4: string;
  studyEnergyBoost: string;
  motivationDescription5: string;
  
  // TeacherMode translations
  teacherModeDescription: string;
  chapter: string;
  enterChapter: string;
  selectSubject: string;
  customSubject: string;
  enterCustomSubject: string;
  studentName: string;
  enterStudentName: string;
  teachingStyle: string;
  teacherStyleInteractive: string;
  teacherStyleStandard: string;
  category: string;
  categoryConcise: string;
  categoryDetailed: string;
  action: string;
  actionNotes: string;
  actionRead: string;
  
  // Alternative Classes translations
  alternativeClasses: string;
  alternativeClassesPlaceholder: string;
  alternativeClassesExample: string;
  
  // Backup & Restore translations
  dataManagement: string;
  backupRestore: string;
  createBackup: string;
  restoreBackup: string;
  backupDescription: string;
  encryptedStorage: string;
  openBackupRestore: string;
  googleDriveBackupSystem: string;
  createNewBackup: string;
  backupAllData: string;
  creatingBackup: string;
  restorePreviousBackup: string;
  noBackupsFound: string;
  restore: string;
  information: string;
  backupSecurelyStores: string;
  storedInPrivateFolder: string;
  canRestoreAnytime: string;
  canSyncAcrossDevices: string;
  backupCreatedSuccessfully: string;
  failedToCreateBackup: string;
  errorCreatingBackup: string;
  dataRestoredFrom: string;
  failedToRestoreBackup: string;
  errorRestoringBackup: string;
  backupDeleted: string;
  failedToDeleteBackup: string;
  errorDeletingBackup: string;
  pleaseLoginToCreateBackup: string;
  failedToLoadBackupList: string;
}

export type TranslationsRecord = Record<Language, TranslationKeys>;
