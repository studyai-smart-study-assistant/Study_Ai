export interface ActivityData {
  userId: string;
  subject: string;
  activityType: 'quiz' | 'notes' | 'live_teaching' | 'study_plan' | 'task' | 'problem_solving';
  content: string;
  timestamp: string;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubjectInterest {
  subject: string;
  interestScore: number;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  totalActivities: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: string;
  strongTopics: string[];
  weakTopics: string[];
}

export class StudentActivityTracker {
  static analyzeMessageForSubject(message: string): string {
    const subjectKeywords = {
      'गणित': ['math', 'गणित', 'अंक', 'संख्या', 'गुणा', 'भाग', 'जोड़', 'घटाव', 'algebra', 'geometry', 'trigonometry', 'calculus'],
      'विज्ञान': ['science', 'विज्ञान', 'भौतिक', 'रसायन', 'जीव', 'physics', 'chemistry', 'biology', 'प्रकाश', 'ध्वनि', 'गुरुत्वाकर्षण'],
      'हिंदी': ['hindi', 'हिंदी', 'व्याकरण', 'साहित्य', 'कविता', 'गद्य', 'grammar', 'संज्ञा', 'सर्वनाम', 'विशेषण'],
      'अंग्रेजी': ['english', 'अंग्रेजी', 'grammar', 'literature', 'essay', 'poem', 'verb', 'noun', 'adjective'],
      'सामाजिक विज्ञान': ['social', 'सामाजिक', 'इतिहास', 'भूगोल', 'राजनीति', 'history', 'geography', 'civics', 'economics'],
      'कंप्यूटर': ['computer', 'कंप्यूटर', 'programming', 'coding', 'software', 'hardware', 'algorithm']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      const matchCount = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (matchCount > 0) {
        return subject;
      }
    }
    
    return 'सामान्य';
  }

  static assessKnowledgeLevel(activities: ActivityData[]): 'beginner' | 'intermediate' | 'advanced' {
    if (activities.length === 0) return 'beginner';
    
    const averageScore = activities
      .filter(a => a.correctAnswers !== undefined && a.totalQuestions !== undefined)
      .reduce((sum, a) => sum + ((a.correctAnswers! / a.totalQuestions!) * 100), 0) / activities.length;
    
    const totalActivities = activities.length;
    
    if (averageScore >= 80 && totalActivities >= 20) return 'advanced';
    if (averageScore >= 60 && totalActivities >= 10) return 'intermediate';
    return 'beginner';
  }

  static trackActivity(userId: string, activity: Omit<ActivityData, 'userId' | 'timestamp'>): void {
    const activityData: ActivityData = {
      ...activity,
      userId,
      timestamp: new Date().toISOString()
    };

    const key = `${userId}_activities`;
    const existingActivities = JSON.parse(localStorage.getItem(key) || '[]');
    existingActivities.push(activityData);
    
    // Keep only last 1000 activities to prevent storage overflow
    if (existingActivities.length > 1000) {
      existingActivities.splice(0, existingActivities.length - 1000);
    }
    
    localStorage.setItem(key, JSON.stringify(existingActivities));
    
    console.log('Activity tracked:', activityData);
  }

  static getSubjectInterests(userId: string): SubjectInterest[] {
    const activities = this.getUserActivities(userId);
    const subjectGroups = activities.reduce((groups, activity) => {
      if (!groups[activity.subject]) {
        groups[activity.subject] = [];
      }
      groups[activity.subject].push(activity);
      return groups;
    }, {} as Record<string, ActivityData[]>);

    return Object.entries(subjectGroups).map(([subject, subjectActivities]) => {
      const totalActivities = subjectActivities.length;
      const totalTimeSpent = subjectActivities.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      
      const scoredActivities = subjectActivities.filter(a => 
        a.correctAnswers !== undefined && a.totalQuestions !== undefined
      );
      
      const averageScore = scoredActivities.length > 0 
        ? scoredActivities.reduce((sum, a) => sum + ((a.correctAnswers! / a.totalQuestions!) * 100), 0) / scoredActivities.length
        : 0;

      // Calculate interest score based on activity frequency, time spent, and recency
      const recentActivities = subjectActivities.filter(a => 
        new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      const interestScore = Math.min(100, (totalActivities * 2) + (recentActivities * 5) + (totalTimeSpent / 60));

      return {
        subject,
        interestScore,
        knowledgeLevel: this.assessKnowledgeLevel(subjectActivities),
        totalActivities,
        averageScore,
        timeSpent: totalTimeSpent,
        lastActivity: subjectActivities[subjectActivities.length - 1]?.timestamp || '',
        strongTopics: this.extractTopics(subjectActivities, true),
        weakTopics: this.extractTopics(subjectActivities, false)
      };
    }).sort((a, b) => b.interestScore - a.interestScore);
  }

  static getUserActivities(userId: string): ActivityData[] {
    const key = `${userId}_activities`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  static extractTopics(activities: ActivityData[], strong: boolean): string[] {
    const topicScores = activities.reduce((topics, activity) => {
      const words = activity.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) {
          if (!topics[word]) topics[word] = { correct: 0, total: 0 };
          topics[word].total++;
          if (activity.correctAnswers && activity.totalQuestions) {
            const score = activity.correctAnswers / activity.totalQuestions;
            if (score > 0.7) topics[word].correct++;
          }
        }
      });
      return topics;
    }, {} as Record<string, { correct: number, total: number }>);

    return Object.entries(topicScores)
      .filter(([_, data]) => data.total >= 2)
      .sort((a, b) => {
        const scoreA = a[1].correct / a[1].total;
        const scoreB = b[1].correct / b[1].total;
        return strong ? scoreB - scoreA : scoreA - scoreB;
      })
      .slice(0, 5)
      .map(([topic]) => topic);
  }
}
