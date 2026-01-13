
import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, BookOpen, CheckSquare, Target, Calendar, Star, Trophy, LogIn, Filter } from 'lucide-react';
import { getUserPointsHistory } from '@/lib/supabase/chat-functions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PointsHistoryItem { id: number; type: string; points: number; description: string; timestamp: string; }
interface StudentPointsHistoryProps { currentUser: any; }

const StudentPointsHistory: React.FC<StudentPointsHistoryProps> = ({ currentUser }) => {
  const [historyItems, setHistoryItems] = useState<PointsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      getUserPointsHistory(currentUser.uid).then(data => {
        setHistoryItems(data.map((item: any) => ({ id: item.id || Date.now(), type: item.type || 'activity', points: item.points || 0, description: item.description || '', timestamp: item.timestamp || new Date().toISOString() })));
      }).catch(() => {
        const saved = localStorage.getItem(`${currentUser.uid}_points_history`);
        if (saved) setHistoryItems(JSON.parse(saved));
      }).finally(() => setLoading(false));
    }
  }, [currentUser]);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4 text-indigo-500" />;
      case 'task': return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'streak': return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'quiz': return <Star className="h-4 w-4 text-blue-500" />;
      default: return <LogIn className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const filtered = filter === 'all' ? historyItems : historyItems.filter(i => i.type === filter);
  const grouped = filtered.reduce<Record<string, PointsHistoryItem[]>>((acc, item) => { const date = new Date(item.timestamp).toLocaleDateString('hi-IN'); if (!acc[date]) acc[date] = []; acc[date].push(item); return acc; }, {});

  return (
    <CardContent className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold flex items-center gap-2"><Award className="h-5 w-5 text-purple-600" />पॉइंट्स इतिहास</h3><Badge variant="outline">{historyItems.length} गतिविधियां</Badge></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-[140px]"><SelectValue placeholder="सभी" /></SelectTrigger><SelectContent><SelectItem value="all">सभी</SelectItem><SelectItem value="streak">स्ट्रीक</SelectItem><SelectItem value="quiz">क्विज़</SelectItem><SelectItem value="achievement">उपलब्धि</SelectItem></SelectContent></Select>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div> : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500 flex items-center"><Calendar className="h-4 w-4 mr-1" />{date}</h4>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-md">
                    <div className="p-2 bg-white rounded-full">{getTypeIcon(item.type)}</div>
                    <div className="flex-1"><p className="text-sm font-medium">{item.description}</p><p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}</p></div>
                    <Badge className="bg-green-100 text-green-800">+{item.points}</Badge>
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && <div className="text-center py-6 text-gray-500"><Award className="h-10 w-10 mx-auto mb-2 text-gray-300" /><p>कोई इतिहास नहीं</p></div>}
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default StudentPointsHistory;
