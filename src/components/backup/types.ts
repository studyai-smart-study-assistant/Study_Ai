
export interface BackupFile {
  id: string;
  name: string;
  createdTime: string;
  size: string;
}

export interface BackupData {
  studyData: {
    studySessions: string;
    totalStudyTime: string;
    points: string;
    level: string;
    timerSettings: {
      soundEnabled: string;
      breakTime: string;
    };
  };
  userProfile: {
    uid: string;
    email: string | null;
    displayName: string | null;
    category: string;
    educationLevel: string;
  };
  chatHistory: any[];
  timerStats: {
    dailyGoals: string;
    weeklyProgress: string;
  };
  achievements: any[];
  savedMessages: any[];
  timestamp: string;
  version: string;
}
