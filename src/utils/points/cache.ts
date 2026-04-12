import { queryClient } from '@/lib/queryClient';

export interface UserPointsSnapshot {
  points: number;
  level: number;
  credits?: number;
}

export const getUserPointsQueryKey = (userId: string) => ['user-points-balance', userId] as const;

export function updateUserPointsCache(userId: string, snapshot: UserPointsSnapshot): void {
  if (!userId) return;

  queryClient.setQueryData(getUserPointsQueryKey(userId), snapshot);
}
