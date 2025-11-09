import { deductCreditsFromUser } from './core';

// Feature costs in credits
export const FEATURE_COSTS = {
  teacher_mode: 10,
  notes_generator: 10,
  quiz_generator: 5,
  homework_assistant: 3,
  motivation_system: 2,
  study_planner: 5,
} as const;

export type FeatureType = keyof typeof FEATURE_COSTS;

export const deductCreditsForFeature = async (
  userId: string,
  feature: FeatureType
): Promise<boolean> => {
  const cost = FEATURE_COSTS[feature];
  const descriptions = {
    teacher_mode: 'टीचर मोड का उपयोग',
    notes_generator: 'नोट्स जेनरेट करना',
    quiz_generator: 'क्विज़ जेनरेट करना',
    homework_assistant: 'होमवर्क सहायता',
    motivation_system: 'मोटिवेशन सिस्टम',
    study_planner: 'स्टडी प्लानर',
  };

  return await deductCreditsFromUser(
    userId,
    cost,
    feature,
    descriptions[feature]
  );
};
