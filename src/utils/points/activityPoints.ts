
import { addPointsToUser } from './core';

export async function addQuizCompletionPoints(
  userId: string, 
  correctAnswers: number, 
  totalQuestions: number
): Promise<void> {
  if (!userId) return;
  
  const percentage = (correctAnswers / totalQuestions) * 100;
  let points = 5; // Base points
  let message = 'क्विज पूरा किया';
  
  if (percentage === 100) {
    points = 15;
    message = 'क्विज में पूर्ण अंक प्राप्त किए';
  } else if (percentage >= 80) {
    points = 10;
    message = 'क्विज में उत्कृष्ट प्रदर्शन';
  }
  
  await addPointsToUser(userId, points, 'quiz', message);
}

export async function addChapterCompletionPoints(userId: string, chapterName: string): Promise<void> {
  if (!userId) return;
  
  const key = `${userId}_chapter_${chapterName.replace(/\s+/g, '_')}`;
  
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, 'completed');
    await addPointsToUser(userId, 10, 'activity', `${chapterName} अध्याय पूरा किया`);
  }
}
