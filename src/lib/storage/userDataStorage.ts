import { idbGet, idbSet, STORES } from './indexedDb';
import type { DetailedActivityData } from '@/utils/comprehensiveActivityTracker';

export interface SavedContent {
  id: string;
  title: string;
  type: 'notes' | 'quiz' | 'plan';
  content: string;
  savedAt: string;
  subject: string;
  size: string;
}

const SAVED_CONTENT_KEY = 'studyai_saved_content';
const MAX_ACTIVITY_ITEMS = 2000;

export async function getSavedContent(): Promise<SavedContent[]> {
  return (await idbGet<SavedContent[]>(STORES.savedContent, SAVED_CONTENT_KEY)) ?? [];
}

export async function setSavedContent(items: SavedContent[]): Promise<void> {
  await idbSet(STORES.savedContent, SAVED_CONTENT_KEY, items);
  localStorage.setItem('studyai_saved_content_meta', JSON.stringify({ count: items.length, updatedAt: Date.now() }));
}

export async function clearSavedContent(): Promise<void> {
  await idbSet(STORES.savedContent, SAVED_CONTENT_KEY, []);
  localStorage.removeItem('studyai_saved_content_meta');
}

export async function getActivities(userId: string): Promise<DetailedActivityData[]> {
  return (await idbGet<DetailedActivityData[]>(STORES.activities, `${userId}_comprehensive_activities`)) ?? [];
}

export async function addActivity(activity: DetailedActivityData): Promise<void> {
  const key = `${activity.userId}_comprehensive_activities`;
  const existing = (await getActivities(activity.userId)) ?? [];
  existing.push(activity);
  if (existing.length > MAX_ACTIVITY_ITEMS) {
    existing.splice(0, existing.length - MAX_ACTIVITY_ITEMS);
  }
  await idbSet(STORES.activities, key, existing);
  localStorage.setItem(`${activity.userId}_comprehensive_activities_meta`, JSON.stringify({ count: existing.length, updatedAt: Date.now() }));
}
