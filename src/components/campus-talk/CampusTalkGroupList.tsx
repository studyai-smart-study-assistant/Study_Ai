
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampusTalkCreateGroup from './CampusTalkCreateGroup';
import CampusTalkGroupConversation from './CampusTalkGroupConversation';

export interface CampusGroup {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  created_by: string;
  created_at: string;
  only_admins_send: boolean;
  only_admins_add_members: boolean;
  member_count?: number;
  last_message?: string;
  last_message_time?: string | null;
  my_role?: string;
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
  searchQuery: string;
}

const CampusTalkGroupList: React.FC<Props> = ({ searchQuery }) => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<CampusGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CampusGroup | null>(null);

  const loadGroups = async () => {
    if (!currentUser) return;
    try {
      // Get groups where user is member
      const { data: memberships } = await supabase
        .from('campus_group_members' as any)
        .select('group_id, role')
        .eq('user_uid', currentUser.uid);

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = (memberships as any[]).map((m: any) => m.group_id);
      const roleMap: Record<string, string> = {};
      (memberships as any[]).forEach((m: any) => { roleMap[m.group_id] = m.role; });

      const { data: groupsData } = await supabase
        .from('campus_groups' as any)
        .select('*')
        .in('id', groupIds);

      if (!groupsData) { setGroups([]); setLoading(false); return; }

      const enriched = await Promise.all(
        (groupsData as any[]).map(async (g: any) => {
          const { count } = await supabase
            .from('campus_group_members' as any)
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id);

          const { data: lastMsg } = await supabase
            .from('campus_group_messages' as any)
            .select('text_content, message_type, created_at')
            .eq('group_id', g.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...g,
            member_count: count || 0,
            last_message: (lastMsg as any)?.text_content || 'No messages yet',
            last_message_time: (lastMsg as any)?.created_at,
            my_role: roleMap[g.id] || 'member',
          };
        })
      );

      enriched.sort((a, b) => {
        const ta = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const tb = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return tb - ta;
      });

      setGroups(enriched);
    } catch (err) {
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) loadGroups();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('campus-group-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campus_group_messages' }, () => loadGroups())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campus_group_members' }, () => loadGroups())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const filtered = groups.filter(g =>
    !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts?: string | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  };

  if (selectedGroup) {
    return (
      <div className="fixed inset-0 z-[60] bg-background">
        <CampusTalkGroupConversation
          group={selectedGroup}
          onBack={() => { setSelectedGroup(null); loadGroups(); }}
        />
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="fixed inset-0 z-[60] bg-background">
        <CampusTalkCreateGroup
          onBack={() => setShowCreate(false)}
          onCreated={(group) => { setShowCreate(false); setSelectedGroup(group); loadGroups(); }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Create button */}
      <div className="px-4 py-3">
        <Button
          onClick={() => setShowCreate(true)}
          className="w-full bg-[hsl(230,70%,55%)] hover:bg-[hsl(230,70%,45%)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          नया Group बनाएं
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-7 w-7 border-3 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 px-6">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'कोई group नहीं मिला' : 'अभी कोई group नहीं है। नया group बनाएं!'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              {group.avatar_url ? (
                <img src={group.avatar_url} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className={`w-12 h-12 rounded-full ${getColor(group.name)} flex items-center justify-center text-white font-bold text-lg`}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-sm text-foreground truncate">{group.name}</h3>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{formatTime(group.last_message_time)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{group.member_count}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{group.last_message}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampusTalkGroupList;
