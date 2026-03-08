import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, AlertTriangle, Clock, Key, RefreshCw, ArrowLeft, Zap, XCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ServiceStat {
  total: number;
  success: number;
  errors: number;
  rateLimits: number;
  avgResponseTime: number;
  keys: Record<string, number>;
}

interface UsageLog {
  service: string;
  key_identifier: string;
  status: string;
  error_code: string | null;
  response_time_ms: number | null;
  created_at: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const AdminDashboard = () => {
  const { isAdmin, isChecking, currentUser } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, ServiceStat>>({});
  const [hourlyData, setHourlyData] = useState<Record<string, number>>({});
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-api-usage', {
        body: { action: 'stats', days },
      });
      if (error) throw error;
      setStats(data.serviceStats || {});
      setHourlyData(data.hourlyData || {});
      setRecentLogs(data.recentLogs || []);
      setTotalLogs(data.totalLogs || 0);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, days]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Login Required</h2>
        <p className="text-muted-foreground">पहले login करें</p>
        <Button onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Shield className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">आपके पास admin access नहीं है</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Home
        </Button>
      </div>
    );
  }

  const totalRequests = Object.values(stats).reduce((s, v) => s + v.total, 0);
  const totalErrors = Object.values(stats).reduce((s, v) => s + v.errors, 0);
  const totalRateLimits = Object.values(stats).reduce((s, v) => s + v.rateLimits, 0);
  const avgTime = totalRequests > 0
    ? Math.round(Object.values(stats).reduce((s, v) => s + v.avgResponseTime * v.total, 0) / totalRequests)
    : 0;

  const serviceChartData = Object.entries(stats).map(([service, s]) => ({
    name: service,
    success: s.success,
    errors: s.errors,
    rateLimits: s.rateLimits,
  }));

  const pieData = Object.entries(stats).map(([service, s]) => ({
    name: service,
    value: s.total,
  }));

  const hourlyChartData = Object.entries(hourlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-48)
    .map(([hour, count]) => ({
      hour: hour.substring(11, 13) + ':00',
      requests: count,
    }));

  const statusColor = (status: string) => {
    if (status === 'success') return 'bg-green-500/10 text-green-500';
    if (status === 'rate_limited') return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" /> API Usage Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Last {days} days • {totalLogs} total logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[1, 7, 30].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
            >
              {d}D
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="h-4 w-4" /> Total Requests
            </div>
            <p className="text-3xl font-bold text-foreground mt-1">{totalRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" /> Success Rate
            </div>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {totalRequests > 0 ? Math.round(((totalRequests - totalErrors - totalRateLimits) / totalRequests) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" /> Rate Limits
            </div>
            <p className="text-3xl font-bold text-yellow-500 mt-1">{totalRateLimits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" /> Avg Response
            </div>
            <p className="text-3xl font-bold text-foreground mt-1">{avgTime}ms</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keys">Key Usage</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Service Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requests by Service</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceChartData}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#22c55e" name="Success" />
                    <Bar dataKey="rateLimits" fill="#f59e0b" name="Rate Limited" />
                    <Bar dataKey="errors" fill="#ef4444" name="Errors" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data yet. Usage will appear here as API calls are made.</p>
              )}
            </CardContent>
          </Card>

          {/* Distribution + Hourly */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hourly Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hourlyChartData}>
                      <XAxis dataKey="hour" fontSize={10} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="requests" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keys" className="mt-4 space-y-4">
          {Object.entries(stats).map(([service, s]) => (
            <Card key={service}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" /> {service}
                  <Badge variant="secondary">{s.total} calls</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {Object.entries(s.keys).sort(([, a], [, b]) => b - a).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="font-mono text-sm text-foreground">{key}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / s.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1 text-green-500"><CheckCircle className="h-3 w-3" /> {s.success} success</span>
                  <span className="flex items-center gap-1 text-yellow-500"><AlertTriangle className="h-3 w-3" /> {s.rateLimits} rate limited</span>
                  <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> {s.errors} errors</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Zap className="h-3 w-3" /> {s.avgResponseTime}ms avg</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {Object.keys(stats).length === 0 && (
            <p className="text-center text-muted-foreground py-12">No key usage data yet</p>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">Time</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Service</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Key</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString('en-IN', { hour12: true, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 font-medium text-foreground">{log.service}</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{log.key_identifier}</td>
                        <td className="p-3">
                          <Badge className={statusColor(log.status)} variant="secondary">
                            {log.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{log.response_time_ms || '-'}</td>
                      </tr>
                    ))}
                    {recentLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">No logs yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
