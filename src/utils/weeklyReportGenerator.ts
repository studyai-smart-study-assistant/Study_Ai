
import { ComprehensiveActivityTracker, DetailedActivityData } from './comprehensiveActivityTracker';
import { getUserRealTimeUsage } from './realTimeUsageTracker';
import { supabase } from '@/integrations/supabase/client';

export interface DailyBreakdown {
  day: string;
  dayLabel: string;
  studyMinutes: number;
  activities: number;
  quizzes: number;
  accuracy: number;
}

export interface SubjectBreakdown {
  subject: string;
  minutes: number;
  activities: number;
  accuracy: number;
  color: string;
}

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  totalStudyMinutes: number;
  totalActivities: number;
  quizzesTaken: number;
  averageAccuracy: number;
  notesCreated: number;
  chaptersRead: number;
  interactiveSessions: number;
  topSubjects: string[];
  strongAreas: string[];
  weakAreas: string[];
  dailyBreakdown: DailyBreakdown[];
  subjectBreakdown: SubjectBreakdown[];
  overviewSummary: string;
  engagementScore: number;
  consistencyScore: number;
  reportType: 'weekly' | 'monthly';
}

const SUBJECT_COLORS: Record<string, string> = {
  'गणित': '#8b5cf6',
  'विज्ञान': '#3b82f6',
  'हिंदी': '#ef4444',
  'अंग्रेजी': '#10b981',
  'सामाजिक विज्ञान': '#f97316',
  'कंप्यूटर': '#0ea5e9',
  'सामान्य': '#6b7280',
};

const DAY_LABELS = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function filterActivitiesByRange(activities: DetailedActivityData[], start: Date, end: Date): DetailedActivityData[] {
  return activities.filter(a => {
    const ts = new Date(a.timestamp);
    return ts >= start && ts <= end;
  });
}

export function generateReport(
  userId: string,
  type: 'weekly' | 'monthly' = 'weekly'
): WeeklyReportData {
  const allActivities = ComprehensiveActivityTracker.getUserActivities(userId);
  const range = type === 'weekly' ? getWeekRange() : getMonthRange();
  const activities = filterActivitiesByRange(allActivities, range.start, range.end);

  // Daily breakdown
  const dailyBreakdown: DailyBreakdown[] = [];
  const daysCount = type === 'weekly' ? 7 : Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < (type === 'weekly' ? 7 : daysCount); i++) {
    const dayDate = new Date(range.start);
    dayDate.setDate(range.start.getDate() + i);
    const dayStr = dayDate.toDateString();

    const dayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === dayStr);
    const quizActs = dayActivities.filter(a => a.activityType === 'quiz');
    const avgAcc = quizActs.length > 0
      ? quizActs.reduce((s, a) => s + (a.accuracy || 0), 0) / quizActs.length
      : 0;

    dailyBreakdown.push({
      day: dayDate.toISOString().split('T')[0],
      dayLabel: type === 'weekly' ? DAY_LABELS[dayDate.getDay()] : `${dayDate.getDate()}`,
      studyMinutes: Math.round(dayActivities.reduce((s, a) => s + ((a.timeSpent || 0) / 60), 0)),
      activities: dayActivities.length,
      quizzes: quizActs.length,
      accuracy: Math.round(avgAcc),
    });
  }

  // Subject breakdown
  const subjectMap: Record<string, { minutes: number; activities: number; accuracySum: number; quizCount: number }> = {};
  activities.forEach(a => {
    if (!subjectMap[a.subject]) subjectMap[a.subject] = { minutes: 0, activities: 0, accuracySum: 0, quizCount: 0 };
    subjectMap[a.subject].minutes += (a.timeSpent || 0) / 60;
    subjectMap[a.subject].activities += 1;
    if (a.activityType === 'quiz' && a.accuracy !== undefined) {
      subjectMap[a.subject].accuracySum += a.accuracy;
      subjectMap[a.subject].quizCount += 1;
    }
  });

  const subjectBreakdown: SubjectBreakdown[] = Object.entries(subjectMap)
    .map(([subject, data]) => ({
      subject,
      minutes: Math.round(data.minutes),
      activities: data.activities,
      accuracy: data.quizCount > 0 ? Math.round(data.accuracySum / data.quizCount) : 0,
      color: SUBJECT_COLORS[subject] || '#6b7280',
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const totalStudyMinutes = Math.round(activities.reduce((s, a) => s + ((a.timeSpent || 0) / 60), 0));
  const quizActivities = activities.filter(a => a.activityType === 'quiz');
  const averageAccuracy = quizActivities.length > 0
    ? Math.round(quizActivities.reduce((s, a) => s + (a.accuracy || 0), 0) / quizActivities.length)
    : 0;

  const notesCreated = activities.filter(a => a.activityType === 'notes_creation').length;
  const chaptersRead = activities.filter(a => a.activityType === 'chapter_reading').length;
  const interactiveSessions = activities.filter(a => a.activityType === 'interactive_teaching').length;
  const topSubjects = subjectBreakdown.slice(0, 3).map(s => s.subject);

  // Usage data from real-time tracker
  const usageData = JSON.parse(localStorage.getItem(`${userId}_usage_data`) || '{}');
  const appMinutes = usageData.totalMinutes || 0;

  // Consistency: how many days had activity
  const activeDays = dailyBreakdown.filter(d => d.activities > 0).length;
  const consistencyScore = Math.round((activeDays / (type === 'weekly' ? 7 : daysCount)) * 100);

  // Engagement score
  const avgEngagement = activities.length > 0
    ? activities.reduce((s, a) => s + (a.engagementScore || 5), 0) / activities.length
    : 0;
  const engagementScore = Math.round(avgEngagement * 10);

  // Strong/weak areas
  const strongAreas = subjectBreakdown.filter(s => s.accuracy >= 70).map(s => s.subject);
  const weakAreas = subjectBreakdown.filter(s => s.accuracy > 0 && s.accuracy < 60).map(s => s.subject);

  // Generate overview summary in Hindi
  const periodLabel = type === 'weekly' ? 'इस सप्ताह' : 'इस महीने';
  let summary = `${periodLabel} आपने कुल ${totalStudyMinutes} मिनट पढ़ाई की`;
  if (quizActivities.length > 0) summary += `, ${quizActivities.length} क्विज़ दिए (औसत सटीकता: ${averageAccuracy}%)`;
  if (notesCreated > 0) summary += `, ${notesCreated} नोट्स बनाए`;
  if (topSubjects.length > 0) summary += `। मुख्य विषय: ${topSubjects.join(', ')}`;
  if (consistencyScore >= 70) summary += '। बहुत अच्छी निरंतरता! 🔥';
  else if (consistencyScore >= 40) summary += '। और नियमित रहने की कोशिश करें।';
  else summary += '। रोज़ पढ़ने की आदत बनाएं! 💪';
  summary += '.';

  return {
    weekStart: range.start.toISOString().split('T')[0],
    weekEnd: range.end.toISOString().split('T')[0],
    totalStudyMinutes,
    totalActivities: activities.length,
    quizzesTaken: quizActivities.length,
    averageAccuracy,
    notesCreated,
    chaptersRead,
    interactiveSessions,
    topSubjects,
    strongAreas,
    weakAreas,
    dailyBreakdown,
    subjectBreakdown,
    overviewSummary: summary,
    engagementScore,
    consistencyScore,
    reportType: type,
  };
}

export async function saveReportToSupabase(userId: string, report: WeeklyReportData): Promise<void> {
  try {
    const { error } = await supabase.from('weekly_reports').upsert({
      user_id: userId,
      week_start: report.weekStart,
      week_end: report.weekEnd,
      total_study_minutes: report.totalStudyMinutes,
      total_activities: report.totalActivities,
      quizzes_taken: report.quizzesTaken,
      average_accuracy: report.averageAccuracy,
      notes_created: report.notesCreated,
      chapters_read: report.chaptersRead,
      interactive_sessions: report.interactiveSessions,
      top_subjects: report.topSubjects,
      strong_areas: report.strongAreas,
      weak_areas: report.weakAreas,
      daily_breakdown: report.dailyBreakdown as any,
      subject_breakdown: report.subjectBreakdown as any,
      overview_summary: report.overviewSummary,
      engagement_score: report.engagementScore,
      consistency_score: report.consistencyScore,
      report_type: report.reportType,
    }, { onConflict: 'user_id,week_start,report_type' });

    if (error) console.error('Error saving report:', error);
    else console.log('Weekly report saved to backend');
  } catch (err) {
    console.error('Error saving weekly report:', err);
  }
}

export async function getStoredReports(userId: string, limit = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}
