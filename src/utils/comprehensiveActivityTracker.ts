export interface DetailedActivityData {
  userId: string;
  subject: string;
  activityType: 'notes_creation' | 'quiz' | 'interactive_teaching' | 'study_session' | 'chapter_reading' | 'live_chat' | 'problem_solving';
  content: string;
  timestamp: string;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number; // in seconds
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sessionId?: string;
  chapterName?: string;
  topicDetails?: string;
  accuracy?: number;
  engagementScore?: number; // 1-10 based on interaction quality
}

export interface ComprehensiveSubjectProgress {
  subject: string;
  totalActivities: number;
  studyTimeMinutes: number;
  averageAccuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  recentActivity: string;
  progressPercentage: number;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  interestScore: number;
  consistencyScore: number;
  color: string;
  activities: {
    notesCreated: number;
    quizzesTaken: number;
    interactiveTeaching: number;
    studySessions: number;
    chaptersRead: number;
  };
}

export class ComprehensiveActivityTracker {
  private static subjectKeywords = {
    'गणित': ['math', 'गणित', 'अंक', 'संख्या', 'गुणा', 'भाग', 'जोड़', 'घटाव', 'algebra', 'geometry', 'trigonometry', 'calculus', 'equation', 'formula'],
    'विज्ञान': ['science', 'विज्ञान', 'भौतिक', 'रसायन', 'जीव', 'physics', 'chemistry', 'biology', 'प्रकाश', 'ध्वनि', 'गुरुत्वाकर्षण', 'atom', 'molecule'],
    'हिंदी': ['hindi', 'हिंदी', 'व्याकरण', 'साहित्य', 'कविता', 'गद्य', 'grammar', 'संज्ञा', 'सर्वनाम', 'विशेषण', 'अलंकार'],
    'अंग्रेजी': ['english', 'अंग्रेजी', 'grammar', 'literature', 'essay', 'poem', 'verb', 'noun', 'adjective', 'tense', 'vocabulary'],
    'सामाजिक विज्ञान': ['social', 'सामाजिक', 'इतिहास', 'भूगोल', 'राजनीति', 'history', 'geography', 'civics', 'economics', 'भारत', 'constitution'],
    'कंप्यूटर': ['computer', 'कंप्यूटर', 'programming', 'coding', 'software', 'hardware', 'algorithm', 'technology', 'internet']
  };

  private static subjectColors = [
    '#8b5cf6', // Purple - गणित
    '#3b82f6', // Blue - विज्ञान  
    '#ef4444', // Red - हिंदी
    '#10b981', // Green - अंग्रेजी
    '#f97316', // Orange - सामाजिक विज्ञान
    '#0ea5e9', // Light blue - कंप्यूटर
  ];

  static detectSubjectFromContent(content: string): string {
    const lowerContent = content.toLowerCase();
    
    let maxMatches = 0;
    let detectedSubject = 'सामान्य';
    
    Object.entries(this.subjectKeywords).forEach(([subject, keywords]) => {
      const matches = keywords.filter(keyword => lowerContent.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedSubject = subject;
      }
    });
    
    return detectedSubject;
  }

  static calculateEngagementScore(content: string, timeSpent?: number): number {
    let score = 5; // Base score
    
    // Content quality assessment
    if (content.length > 100) score += 2;
    if (content.length > 200) score += 1;
    
    // Check for question marks (indicating curiosity)
    const questionCount = (content.match(/\?/g) || []).length;
    score += Math.min(questionCount, 2);
    
    // Time spent assessment
    if (timeSpent) {
      if (timeSpent > 300) score += 1; // More than 5 minutes
      if (timeSpent > 600) score += 1; // More than 10 minutes
    }
    
    return Math.min(score, 10);
  }

  static trackNotesCreation(userId: string, subject: string, content: string, timeSpent: number): void {
    const activity: DetailedActivityData = {
      userId,
      subject: this.detectSubjectFromContent(content) || subject,
      activityType: 'notes_creation',
      content,
      timestamp: new Date().toISOString(),
      timeSpent,
      engagementScore: this.calculateEngagementScore(content, timeSpent)
    };
    
    this.saveActivity(activity);
    console.log('Notes creation tracked:', activity);
  }

  static trackInteractiveTeaching(userId: string, messageContent: string, timeSpent: number): void {
    const subject = this.detectSubjectFromContent(messageContent);
    
    const activity: DetailedActivityData = {
      userId,
      subject,
      activityType: 'interactive_teaching',
      content: messageContent,
      timestamp: new Date().toISOString(),
      timeSpent,
      engagementScore: this.calculateEngagementScore(messageContent, timeSpent)
    };
    
    this.saveActivity(activity);
    console.log('Interactive teaching tracked:', activity);
  }

  static trackQuizActivity(userId: string, subject: string, correctAnswers: number, totalQuestions: number, timeSpent: number): void {
    const accuracy = (correctAnswers / totalQuestions) * 100;
    
    const activity: DetailedActivityData = {
      userId,
      subject,
      activityType: 'quiz',
      content: `Quiz completed: ${correctAnswers}/${totalQuestions}`,
      timestamp: new Date().toISOString(),
      correctAnswers,
      totalQuestions,
      timeSpent,
      accuracy,
      engagementScore: accuracy > 80 ? 9 : accuracy > 60 ? 7 : 5
    };
    
    this.saveActivity(activity);
    console.log('Quiz activity tracked:', activity);
  }

  static trackChapterReading(userId: string, chapterName: string, timeSpent: number): void {
    const subject = this.detectSubjectFromContent(chapterName);
    
    const activity: DetailedActivityData = {
      userId,
      subject,
      activityType: 'chapter_reading',
      content: `Chapter read: ${chapterName}`,
      timestamp: new Date().toISOString(),
      chapterName,
      timeSpent,
      engagementScore: this.calculateEngagementScore(chapterName, timeSpent)
    };
    
    this.saveActivity(activity);
    console.log('Chapter reading tracked:', activity);
  }

  static trackStudySession(userId: string, subject: string, sessionData: any): void {
    const activity: DetailedActivityData = {
      userId,
      subject,
      activityType: 'study_session',
      content: `Study session: ${sessionData.topic || 'General study'}`,
      timestamp: new Date().toISOString(),
      timeSpent: sessionData.duration || 0,
      sessionId: sessionData.id,
      engagementScore: sessionData.duration > 1800 ? 8 : sessionData.duration > 900 ? 6 : 4
    };
    
    this.saveActivity(activity);
    console.log('Study session tracked:', activity);
  }

  static saveActivity(activity: DetailedActivityData): void {
    const key = `${activity.userId}_comprehensive_activities`;
    const existingActivities = JSON.parse(localStorage.getItem(key) || '[]');
    
    existingActivities.push(activity);
    
    // Keep only last 2000 activities to prevent storage overflow
    if (existingActivities.length > 2000) {
      existingActivities.splice(0, existingActivities.length - 2000);
    }
    
    localStorage.setItem(key, JSON.stringify(existingActivities));
  }

  static getUserActivities(userId: string): DetailedActivityData[] {
    const key = `${userId}_comprehensive_activities`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  static getComprehensiveProgress(userId: string): ComprehensiveSubjectProgress[] {
    const activities = this.getUserActivities(userId);
    const subjectGroups = this.groupActivitiesBySubject(activities);
    
    return Object.entries(subjectGroups).map(([subject, subjectActivities], index) => {
      return this.calculateSubjectProgress(subject, subjectActivities, index);
    }).sort((a, b) => b.interestScore - a.interestScore);
  }

  private static groupActivitiesBySubject(activities: DetailedActivityData[]): Record<string, DetailedActivityData[]> {
    return activities.reduce((groups, activity) => {
      if (!groups[activity.subject]) {
        groups[activity.subject] = [];
      }
      groups[activity.subject].push(activity);
      return groups;
    }, {} as Record<string, DetailedActivityData[]>);
  }

  private static calculateSubjectProgress(subject: string, activities: DetailedActivityData[], colorIndex: number): ComprehensiveSubjectProgress {
    const totalActivities = activities.length;
    const totalTimeSpent = activities.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const studyTimeMinutes = Math.floor(totalTimeSpent / 60);
    
    // Calculate accuracy from quiz activities
    const quizActivities = activities.filter(a => a.activityType === 'quiz' && a.accuracy !== undefined);
    const averageAccuracy = quizActivities.length > 0 
      ? quizActivities.reduce((sum, a) => sum + (a.accuracy || 0), 0) / quizActivities.length
      : 0;
    
    // Calculate interest score based on recent activity, variety, and engagement
    const recentActivities = activities.filter(a => 
      new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const averageEngagement = activities.reduce((sum, a) => sum + (a.engagementScore || 5), 0) / totalActivities;
    const activityVariety = new Set(activities.map(a => a.activityType)).size;
    
    const interestScore = Math.min(100, 
      (totalActivities * 1.5) + 
      (recentActivities.length * 8) + 
      (studyTimeMinutes / 10) + 
      (averageEngagement * 3) + 
      (activityVariety * 5)
    );
    
    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(activities);
    
    // Determine knowledge level
    const knowledgeLevel = this.determineKnowledgeLevel(activities, averageAccuracy);
    
    // Calculate progress percentage
    const progressPercentage = Math.min(100, 
      (averageAccuracy * 0.4) + 
      (Math.min(totalActivities, 50) * 1.2) + 
      (Math.min(studyTimeMinutes, 300) * 0.1)
    );
    
    // Extract topics
    const strongTopics = this.extractTopics(activities, true);
    const weakTopics = this.extractTopics(activities, false);
    
    // Count activity types
    const activityCounts = {
      notesCreated: activities.filter(a => a.activityType === 'notes_creation').length,
      quizzesTaken: activities.filter(a => a.activityType === 'quiz').length,
      interactiveTeaching: activities.filter(a => a.activityType === 'interactive_teaching').length,
      studySessions: activities.filter(a => a.activityType === 'study_session').length,
      chaptersRead: activities.filter(a => a.activityType === 'chapter_reading').length,
    };
    
    return {
      subject,
      totalActivities,
      studyTimeMinutes,
      averageAccuracy: Math.round(averageAccuracy),
      strongTopics,
      weakTopics,
      recentActivity: activities[activities.length - 1]?.timestamp || '',
      progressPercentage: Math.round(progressPercentage),
      knowledgeLevel,
      interestScore: Math.round(interestScore),
      consistencyScore: Math.round(consistencyScore),
      color: this.subjectColors[colorIndex] || this.subjectColors[5],
      activities: activityCounts
    };
  }

  private static calculateConsistencyScore(activities: DetailedActivityData[]): number {
    if (activities.length < 3) return 20;
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });
    
    const activeDays = last7Days.filter(day => 
      activities.some(a => new Date(a.timestamp).toDateString() === day)
    ).length;
    
    return Math.round((activeDays / 7) * 100);
  }

  private static determineKnowledgeLevel(activities: DetailedActivityData[], averageAccuracy: number): 'beginner' | 'intermediate' | 'advanced' {
    const totalActivities = activities.length;
    const quizCount = activities.filter(a => a.activityType === 'quiz').length;
    
    if (averageAccuracy >= 85 && totalActivities >= 30 && quizCount >= 10) return 'advanced';
    if (averageAccuracy >= 70 && totalActivities >= 15 && quizCount >= 5) return 'intermediate';
    return 'beginner';
  }

  private static extractTopics(activities: DetailedActivityData[], strong: boolean): string[] {
    const topicScores: Record<string, { correct: number, total: number }> = {};
    
    activities.forEach(activity => {
      const words = activity.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4) {
          if (!topicScores[word]) topicScores[word] = { correct: 0, total: 0 };
          topicScores[word].total++;
          
          if (activity.accuracy && activity.accuracy > 70) {
            topicScores[word].correct++;
          } else if (activity.engagementScore && activity.engagementScore > 7) {
            topicScores[word].correct++;
          }
        }
      });
    });

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
