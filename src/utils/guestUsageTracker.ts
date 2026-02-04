/**
 * Guest Usage Tracker
 * Tracks feature usage for non-logged-in users and triggers signup prompts after threshold
 */

export interface GuestUsageData {
  notesCount: number;
  quizCount: number;
  homeworkCount: number;
  studyPlanCount: number;
  chatCount: number;
  totalUsageCount: number;
  firstUsage: string;
  lastUsage: string;
  signupPromptShown: boolean;
  signupPromptDismissedAt?: string;
}

const GUEST_USAGE_KEY = 'study_ai_guest_usage';
const SIGNUP_PROMPT_THRESHOLD = 5; // Show prompt after 5 feature uses
const SIGNUP_PROMPT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours cooldown after dismiss

// Get default usage data
const getDefaultGuestUsage = (): GuestUsageData => ({
  notesCount: 0,
  quizCount: 0,
  homeworkCount: 0,
  studyPlanCount: 0,
  chatCount: 0,
  totalUsageCount: 0,
  firstUsage: new Date().toISOString(),
  lastUsage: new Date().toISOString(),
  signupPromptShown: false,
});

// Get guest usage from localStorage
export const getGuestUsage = (): GuestUsageData => {
  try {
    const data = localStorage.getItem(GUEST_USAGE_KEY);
    return data ? { ...getDefaultGuestUsage(), ...JSON.parse(data) } : getDefaultGuestUsage();
  } catch {
    return getDefaultGuestUsage();
  }
};

// Save guest usage to localStorage
const saveGuestUsage = (data: GuestUsageData): void => {
  try {
    localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving guest usage:', error);
  }
};

// Track feature usage
export type FeatureKey = 'notes' | 'quiz' | 'homework' | 'studyPlan' | 'chat';

export const trackGuestFeatureUsage = (feature: FeatureKey): GuestUsageData => {
  const usage = getGuestUsage();
  
  // Increment specific feature count
  switch (feature) {
    case 'notes':
      usage.notesCount++;
      break;
    case 'quiz':
      usage.quizCount++;
      break;
    case 'homework':
      usage.homeworkCount++;
      break;
    case 'studyPlan':
      usage.studyPlanCount++;
      break;
    case 'chat':
      usage.chatCount++;
      break;
  }
  
  usage.totalUsageCount++;
  usage.lastUsage = new Date().toISOString();
  
  saveGuestUsage(usage);
  return usage;
};

// Check if signup prompt should be shown
export const shouldShowSignupPrompt = (): boolean => {
  const usage = getGuestUsage();
  
  // Check if we've reached threshold
  if (usage.totalUsageCount < SIGNUP_PROMPT_THRESHOLD) {
    return false;
  }
  
  // Check if prompt was recently dismissed
  if (usage.signupPromptDismissedAt) {
    const dismissedAt = new Date(usage.signupPromptDismissedAt).getTime();
    const now = Date.now();
    if (now - dismissedAt < SIGNUP_PROMPT_COOLDOWN) {
      return false;
    }
  }
  
  return true;
};

// Mark signup prompt as shown
export const markSignupPromptShown = (): void => {
  const usage = getGuestUsage();
  usage.signupPromptShown = true;
  saveGuestUsage(usage);
};

// Mark signup prompt as dismissed
export const markSignupPromptDismissed = (): void => {
  const usage = getGuestUsage();
  usage.signupPromptDismissedAt = new Date().toISOString();
  saveGuestUsage(usage);
};

// Reset guest usage (called after successful login/signup)
export const resetGuestUsage = (): void => {
  localStorage.removeItem(GUEST_USAGE_KEY);
};

// Get usage summary for display
export const getUsageSummary = (): string => {
  const usage = getGuestUsage();
  return `${usage.totalUsageCount} features used`;
};
