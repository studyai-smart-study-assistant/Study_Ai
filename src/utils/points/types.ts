
export interface PointRecord {
  id: number;
  type: 'goal' | 'task' | 'activity' | 'login' | 'streak' | 'achievement' | 'quiz';
  points: number;
  description: string;
  timestamp: string;
}
