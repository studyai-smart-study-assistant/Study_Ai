
export interface ProfileData {
  id: string;
  name: string;
  level: number;
  points: number;
  joinedOn: string;
  photoURL?: string;
  category?: string;
  education?: string;
  streak?: number;
  rank?: number;
}

export interface Achievement {
  id: number;
  type: string;
  points: number;
  description: string;
  timestamp: string;
}
