
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Download, Calendar, Clock, BookOpen, Brain, Target, 
  TrendingUp, Flame, Award, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { generateReport, saveReportToSupabase, WeeklyReportData } from '@/utils/weeklyReportGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface WeeklyReportProps {
  userId: string;
  userName?: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#f97316', '#0ea5e9', '#6b7280'];

const WeeklyReport: React.FC<WeeklyReportProps> = ({ userId, userName }) => {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
  }, [userId, reportType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = generateReport(userId, reportType);
      setReport(data);
      // Save overview to backend for AI agent
      await saveReportToSupabase(userId, data);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      toast.loading('PDF बना रहे हैं...');
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Handle multi-page
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const label = reportType === 'weekly' ? 'साप्ताहिक' : 'मासिक';
      pdf.save(`${userName || 'student'}-${label}-रिपोर्ट.pdf`);
      toast.dismiss();
      toast.success('PDF डाउनलोड हो गया! 📄');
    } catch {
      toast.dismiss();
      toast.error('PDF बनाने में समस्या आई');
    }
  };

  if (loading || !report) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
          रिपोर्ट तैयार हो रहा है...
        </CardContent>
      </Card>
    );
  }

  const periodLabel = reportType === 'weekly' ? 'साप्ताहिक' : 'मासिक';
  const hasData = report.totalActivities > 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Tabs value={reportType} onValueChange={(v) => setReportType(v as 'weekly' | 'monthly')}>
          <TabsList>
            <TabsTrigger value="weekly" className="gap-1">
              <Calendar className="h-3.5 w-3.5" /> साप्ताहिक
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1">
              <Calendar className="h-3.5 w-3.5" /> मासिक
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={downloadPDF} variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" /> PDF डाउनलोड
        </Button>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-4">
        {/* Header Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  📊 {periodLabel} रिपोर्ट
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.weekStart} से {report.weekEnd}
                </p>
              </div>
              {report.consistencyScore >= 70 && (
                <Badge className="bg-green-500 text-white shadow-md">🔥 नियमित</Badge>
              )}
            </div>
            
            {/* Overview Summary */}
            <div className="bg-background/80 rounded-lg p-4 border text-sm leading-relaxed">
              {report.overviewSummary}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Clock className="h-5 w-5 text-blue-500" />} label="कुल पढ़ाई" value={`${report.totalStudyMinutes} मिनट`} color="blue" />
          <StatCard icon={<Brain className="h-5 w-5 text-purple-500" />} label="क्विज़" value={`${report.quizzesTaken}`} subValue={report.averageAccuracy > 0 ? `${report.averageAccuracy}% सटीकता` : undefined} color="purple" />
          <StatCard icon={<FileText className="h-5 w-5 text-green-500" />} label="नोट्स बनाए" value={`${report.notesCreated}`} color="green" />
          <StatCard icon={<BookOpen className="h-5 w-5 text-orange-500" />} label="चैप्टर पढ़े" value={`${report.chaptersRead}`} color="orange" />
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{report.engagementScore}%</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Target className="h-3 w-3" /> एंगेजमेंट स्कोर
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{report.consistencyScore}%</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Flame className="h-3 w-3" /> निरंतरता स्कोर
              </p>
            </CardContent>
          </Card>
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">इस अवधि में कोई गतिविधि नहीं मिली</p>
              <p className="text-sm mt-1">पढ़ाई शुरू करें, क्विज़ दें, नोट्स बनाएं — सब यहां दिखेगा!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Daily Study Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> दैनिक पढ़ाई (मिनट)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value} मिनट`, 'पढ़ाई']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="studyMinutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activities per day */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" /> दैनिक गतिविधियां
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={report.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="activities" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="गतिविधियां" />
                    <Line type="monotone" dataKey="quizzes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="क्विज़" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subject Distribution */}
            {report.subjectBreakdown.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> विषय वितरण
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={report.subjectBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="minutes"
                          nameKey="subject"
                          label={({ subject, percent }) => `${subject} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {report.subjectBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} मिनट`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Subject list */}
                  <div className="mt-3 space-y-2">
                    {report.subjectBreakdown.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-medium">{s.subject}</span>
                        </div>
                        <div className="flex gap-3 text-muted-foreground text-xs">
                          <span>{s.minutes} मिनट</span>
                          <span>{s.activities} गतिविधि</span>
                          {s.accuracy > 0 && <span>{s.accuracy}% सटीकता</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strong & Weak Areas */}
            {(report.strongAreas.length > 0 || report.weakAreas.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.strongAreas.length > 0 && (
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-1 mb-2 text-green-700">
                        <Award className="h-4 w-4" /> मजबूत विषय
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {report.strongAreas.map((area, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            ✅ {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {report.weakAreas.length > 0 && (
                  <Card className="border-orange-200">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-1 mb-2 text-orange-700">
                        <Target className="h-4 w-4" /> सुधार करें
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {report.weakAreas.map((area, i) => (
                          <Badge key={i} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                            📌 {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-2 pb-4">
          Study AI • {periodLabel} रिपोर्ट • {new Date().toLocaleDateString('hi-IN')}
        </div>
      </div>
    </div>
  );
};

// Stat card helper
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}> = ({ icon, label, value, subValue }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
    </CardContent>
  </Card>
);

export default WeeklyReport;
