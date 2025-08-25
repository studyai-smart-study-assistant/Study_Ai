

export interface Badge {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface BadgeInfo {
  name: string;
  description: string;
  color: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  xp: number;
  streakDays: number;
  studyHours: number;
  level: number;
  badges: string[]; // Badge IDs as strings
  lastActive: string;
  // New usage tracking fields
  usageMinutes?: number;
  sessionsCount?: number;
  isActive?: boolean;
  currentSessionDuration?: number; // Added missing property
}

