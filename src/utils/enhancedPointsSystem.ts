
import { addPointsToUser } from './points';
import { StudentActivityTracker } from './studentActivityTracker';

export class EnhancedPointsSystem {
  static async awardTaskCompletionPoints(
    userId: string, 
    taskType: 'daily_task' | 'study_plan' | 'quiz' | 'problem_solving' | 'live_teaching',
    taskDetails: {
      subject?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      timeSpent?: number;
      description: string;
    }
  ): Promise<number> {
    let basePoints = 0;
    
    // Base points according to task type
    switch (taskType) {
      case 'daily_task':
        basePoints = 5;
        break;
      case 'study_plan':
        basePoints = 15;
        break;
      case 'quiz':
        basePoints = 10;
        break;
      case 'problem_solving':
        basePoints = taskDetails.difficulty === 'beginner' ? 5 : 
                    taskDetails.difficulty === 'intermediate' ? 10 : 15;
        break;
      case 'live_teaching':
        basePoints = 20;
        break;
    }

    // Bonus points for time spent
    const timeBonus = Math.min(Math.floor((taskDetails.timeSpent || 0) / 300), 10); // 5 minutes = 1 bonus point, max 10
    
    // Bonus points for consistency (if user is active in same subject)
    let consistencyBonus = 0;
    if (taskDetails.subject) {
      const recentActivities = StudentActivityTracker.getUserActivities(userId)
        .filter(a => a.subject === taskDetails.subject)
        .filter(a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
      if (recentActivities.length >= 3) {
        consistencyBonus = 5; // Consistency bonus
      }
    }

    const totalPoints = basePoints + timeBonus + consistencyBonus;

    // Award points through the system
    await addPointsToUser(userId, totalPoints, 'task', taskDetails.description);

    // Track the activity
    if (taskDetails.subject) {
      StudentActivityTracker.trackActivity(userId, {
        subject: taskDetails.subject,
        activityType: taskType === 'daily_task' ? 'task' : taskType,
        content: taskDetails.description,
        timeSpent: taskDetails.timeSpent,
        difficulty: taskDetails.difficulty
      });
    }

    return totalPoints;
  }

  static async awardStudyPlanCompletionPoints(
    userId: string,
    planDetails: {
      subject: string;
      chapter: string;
      completionPercentage: number;
      timeSpent: number;
    }
  ): Promise<number> {
    const basePoints = Math.floor(planDetails.completionPercentage * 0.2); // 20 points for 100% completion
    const timeBonus = Math.min(Math.floor(planDetails.timeSpent / 600), 15); // 10 minutes = 1 point, max 15
    
    const totalPoints = basePoints + timeBonus;
    
    await addPointsToUser(
      userId, 
      totalPoints, 
      'achievement', 
      `अध्ययन योजना पूर्ण: ${planDetails.subject} - ${planDetails.chapter} (${planDetails.completionPercentage}%)`
    );

    // Track study plan activity
    StudentActivityTracker.trackActivity(userId, {
      subject: planDetails.subject,
      activityType: 'study_plan',
      content: `${planDetails.chapter} - ${planDetails.completionPercentage}% पूर्ण`,
      timeSpent: planDetails.timeSpent
    });

    return totalPoints;
  }

  static async awardLiveTeachingParticipationPoints(
    userId: string,
    sessionDetails: {
      subject: string;
      topic: string;
      questionsAsked: number;
      correctAnswers: number;
      totalQuestions: number;
      sessionDuration: number;
    }
  ): Promise<number> {
    let points = 0;
    
    // Base participation points
    points += 10;
    
    // Points for questions asked (encourages engagement)
    points += sessionDetails.questionsAsked * 2;
    
    // Points for correct answers
    points += sessionDetails.correctAnswers * 5;
    
    // Bonus for good accuracy
    const accuracy = sessionDetails.totalQuestions > 0 ? 
      sessionDetails.correctAnswers / sessionDetails.totalQuestions : 0;
    
    if (accuracy >= 0.8) points += 15; // High accuracy bonus
    else if (accuracy >= 0.6) points += 10; // Good accuracy bonus
    else if (accuracy >= 0.4) points += 5; // Participation bonus

    // Session duration bonus
    const durationBonus = Math.min(Math.floor(sessionDetails.sessionDuration / 600), 20); // 10 minutes = 1 point, max 20
    points += durationBonus;

    await addPointsToUser(
      userId,
      points,
      'achievement',
      `Live Teaching सत्र: ${sessionDetails.subject} - ${sessionDetails.topic} (${sessionDetails.correctAnswers}/${sessionDetails.totalQuestions} सही)`
    );

    // Track live teaching activity
    StudentActivityTracker.trackActivity(userId, {
      subject: sessionDetails.subject,
      activityType: 'live_teaching',
      content: `${sessionDetails.topic} - ${sessionDetails.questionsAsked} प्रश्न पूछे, ${sessionDetails.correctAnswers}/${sessionDetails.totalQuestions} सही`,
      correctAnswers: sessionDetails.correctAnswers,
      totalQuestions: sessionDetails.totalQuestions,
      timeSpent: sessionDetails.sessionDuration
    });

    return points;
  }
}
