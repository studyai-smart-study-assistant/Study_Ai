import React, { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Edit2, Save, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Memory {
  id: string;
  memory_key: string;
  memory_value: string;
  source: string;
  category: string;
  importance: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'personal', label: '👤 व्यक्तिगत', labelEn: 'Personal' },
  { value: 'academic', label: '📚 पढ़ाई', labelEn: 'Academic' },
  { value: 'preference', label: '⭐ पसंद', labelEn: 'Preference' },
  { value: 'goal', label: '🎯 लक्ष्य', labelEn: 'Goal' },
  { value: 'struggle', label: '💪 चुनौती', labelEn: 'Challenge' },
  { value: 'general', label: '📝 सामान्य', labelEn: 'General' },
];

const MindVault: React.FC = () => {
  const { currentUser } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');

  useEffect(() => {
    if (currentUser?.uid) loadMemories();
  }, [currentUser]);

  const loadMemories = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', currentUser.uid)
      .order('importance', { ascending: false });
    if (!error && data) setMemories(data as Memory[]);
    setLoading(false);
  };

  const addMemory = async () => {
    if (!currentUser?.uid || !newKey.trim() || !newValue.trim()) {
      toast.error('कृपया दोनों फ़ील्ड भरें');
      return;
    }
    const { error } = await supabase.from('user_memories').upsert({
      user_id: currentUser.uid,
      memory_key: newKey.trim(),
      memory_value: newValue.trim(),
      category: newCategory,
      source: 'user_added',
      importance: 7,
    }, { onConflict: 'user_id,memory_key' });

    if (error) { toast.error('सेव करने में दिक्कत हुई'); return; }
    toast.success('✨ Mind Vault में जोड़ दिया!');
    setNewKey(''); setNewValue(''); setShowAdd(false);
    loadMemories();
  };

  const deleteMemory = async (id: string) => {
    const { error } = await supabase.from('user_memories').delete().eq('id', id);
    if (!error) { setMemories(prev => prev.filter(m => m.id !== id)); toast.success('हटा दिया गया'); }
  };

  const updateMemory = async (id: string, value: string) => {
    const { error } = await supabase.from('user_memories').update({ memory_value: value }).eq('id', id);
    if (!error) { setEditingId(null); loadMemories(); toast.success('अपडेट हो गया!'); }
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[5];

  if (!currentUser) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Mind Vault
          </h3>
          <Badge variant="secondary" className="text-xs">{memories.length} memories</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> जोड़ें
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        🧠 यहाँ AI आपकी ज़रूरी जानकारी याद रखता है — आप खुद भी जोड़ सकते हैं!
      </p>

      {showAdd && (
        <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
          <Input placeholder="जानकारी का नाम (जैसे: मेरा नाम, पसंदीदा विषय)" value={newKey} onChange={e => setNewKey(e.target.value)} className="text-sm" />
          <Textarea placeholder="जानकारी (जैसे: मुझे Physics में दिक्कत होती है)" value={newValue} onChange={e => setNewValue(e.target.value)} className="text-sm" rows={2} />
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={addMemory}><Save className="h-3 w-3 mr-1" /> सेव करें</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}><X className="h-3 w-3 mr-1" /> रद्द</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">लोड हो रहा है...</div>
      ) : memories.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Sparkles className="h-8 w-8 mx-auto text-purple-400" />
          <p className="text-sm text-muted-foreground">अभी कोई memory नहीं है</p>
          <p className="text-xs text-muted-foreground">AI चैट के दौरान अपने आप ज़रूरी जानकारी यहाँ save होगी, या आप खुद जोड़ सकते हैं!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {memories.map(mem => {
            const catInfo = getCategoryInfo(mem.category);
            return (
              <div key={mem.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm truncate">{mem.memory_key}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{catInfo.label}</Badge>
                      {mem.source === 'ai_detected' && <Badge className="text-[10px] bg-purple-100 text-purple-700 shrink-0">🤖 AI</Badge>}
                    </div>
                    {editingId === mem.id ? (
                      <div className="flex gap-2 mt-1">
                        <Input defaultValue={mem.memory_value} id={`edit-${mem.id}`} className="text-sm" onKeyDown={e => { if (e.key === 'Enter') updateMemory(mem.id, (e.target as HTMLInputElement).value); }} />
                        <Button size="sm" variant="ghost" onClick={() => { const el = document.getElementById(`edit-${mem.id}`) as HTMLInputElement; if (el) updateMemory(mem.id, el.value); }}><Save className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{mem.memory_value}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(mem.id)}><Edit2 className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMemory(mem.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MindVault;
