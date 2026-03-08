
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CampusGroup } from './CampusTalkGroupList';

interface CampusUser {
  firebase_uid: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string | null;
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];
const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

interface Props {
  onBack: () => void;
  onCreated: (group: CampusGroup) => void;
}

const CampusTalkCreateGroup: React.FC<Props> = ({ onBack, onCreated }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('campus_users')
        .select('firebase_uid, display_name, avatar_url, status');
      if (data) setUsers(data.filter(u => u.firebase_uid !== currentUser?.uid));
    };
    load();
  }, [currentUser]);

  const toggle = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Group का नाम डालें');
    if (selected.size === 0) return toast.error('कम से कम 1 member चुनें');
    if (!currentUser) return;

    setCreating(true);
    try {
      const { data: group, error } = await supabase
        .from('campus_groups' as any)
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: currentUser.uid,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner
      await supabase.from('campus_group_members' as any).insert({
        group_id: (group as any).id,
        user_uid: currentUser.uid,
        role: 'owner',
      });

      // Add selected members
      const members = Array.from(selected).map(uid => ({
        group_id: (group as any).id,
        user_uid: uid,
        role: 'member',
      }));

      if (members.length > 0) {
        await supabase.from('campus_group_members' as any).insert(members);
      }

      toast.success('Group बन गया! 🎉');
      onCreated({
        ...(group as any),
        member_count: selected.size + 1,
        my_role: 'owner',
      });
    } catch (err: any) {
      console.error('Create group error:', err);
      toast.error('Group बनाने में error: ' + (err?.message || ''));
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u =>
    !search || (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="bg-[hsl(230,70%,55%)] text-white px-3 py-2.5 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-semibold text-sm">नया Group बनाएं</h2>
          <p className="text-xs text-white/70">{selected.size} members selected</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {/* Group Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Group का नाम *</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name..."
            className="bg-muted border-0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Group description..."
            className="bg-muted border-0"
          />
        </div>

        {/* Selected chips */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected).map(uid => {
              const u = users.find(x => x.firebase_uid === uid);
              const n = u?.display_name || uid.slice(0, 6);
              return (
                <span
                  key={uid}
                  onClick={() => toggle(uid)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[hsl(230,70%,55%)]/10 text-[hsl(230,70%,55%)] text-xs rounded-full cursor-pointer"
                >
                  {n} ✕
                </span>
              );
            })}
          </div>
        )}

        {/* Search & User list */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Members जोड़ें *</label>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="नाम से search करें..."
            className="bg-muted border-0"
          />
        </div>

        {/* User list - always visible */}
        <div className="divide-y divide-border rounded-xl overflow-hidden bg-card border border-border">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {search ? `"${search}" से कोई user नहीं मिला` : 'कोई user उपलब्ध नहीं'}
            </div>
          ) : (
            filtered.map(u => {
              const n = u.display_name || u.firebase_uid.slice(0, 8);
              const isSelected = selected.has(u.firebase_uid);
              return (
                <button
                  key={u.firebase_uid}
                  onClick={() => toggle(u.firebase_uid)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${isSelected ? 'bg-[hsl(230,70%,55%)]/5' : 'hover:bg-muted/50'}`}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={n} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${getColor(n)} flex items-center justify-center text-white font-bold`}>
                      {n.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{n}</p>
                    <p className="text-xs text-muted-foreground">{u.status === 'online' ? '🟢 Online' : 'Offline'}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'bg-[hsl(230,70%,55%)] border-[hsl(230,70%,55%)]' : 'border-muted-foreground/30'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Fixed Create button at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
        <Button
          onClick={handleCreate}
          disabled={creating || !name.trim() || selected.size === 0}
          className="w-full bg-[hsl(230,70%,55%)] hover:bg-[hsl(230,70%,45%)] h-12 text-base font-semibold"
        >
          {creating ? 'बना रहे हैं...' : selected.size === 0 ? 'Members select करें' : `Group बनाएं (${selected.size + 1} members)`}
        </Button>
      </div>
    </div>
  );
};

export default CampusTalkCreateGroup;
