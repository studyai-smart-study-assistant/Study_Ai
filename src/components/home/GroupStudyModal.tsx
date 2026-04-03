import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Search, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { SupabaseClient } from '@supabase/supabase-js';

type GroupInfo = {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  member_count: number;
};

type UserProfile = {
  user_id: string;
  display_name: string | null;
};
type MembershipRow = { group_id: string };
type GroupParticipantRow = { user_id: string };

const GROUP_SYSTEM_PROMPT = `तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के 'Mind Vault' का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक 'personalized classroom' वाली फील आए।`;

interface GroupStudyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

const GroupStudyModal: React.FC<GroupStudyModalProps> = ({ open, onOpenChange, currentUserId }) => {
  const sb = supabase as SupabaseClient;
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(localStorage.getItem('studyai_active_group_id'));
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId) || null, [groups, activeGroupId]);

  const loadGroups = useCallback(async () => {
    if (!currentUserId) return;

    const { data: memberships, error: membershipError } = await sb
      .from('group_participants')
      .select('group_id')
      .eq('user_id', currentUserId);

    if (membershipError) {
      console.error('Failed loading memberships:', membershipError);
      return;
    }

    const membershipRows = (memberships || []) as MembershipRow[];
    const groupIds = membershipRows.map((m) => m.group_id);
    if (!groupIds.length) {
      setGroups([]);
      setActiveGroupId(null);
      localStorage.removeItem('studyai_active_group_id');
      return;
    }

    const { data: groupData, error: groupError } = await sb
      .from('study_groups')
      .select('id,name,invite_code,creator_id')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (groupError) {
      console.error('Failed loading groups:', groupError);
      return;
    }

    const countPromises = (groupData || []).map(async (group: Record<string, string>) => {
      const { count } = await sb
        .from('group_participants')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', group.id);

      return {
        ...group,
        member_count: count || 0,
      } as GroupInfo;
    });

    const enriched = await Promise.all(countPromises);
    setGroups(enriched);

    const keepCurrent = enriched.some((group) => group.id === activeGroupId);
    const nextActive = keepCurrent ? activeGroupId : enriched[0]?.id || null;
    setActiveGroupId(nextActive);
    if (nextActive) localStorage.setItem('studyai_active_group_id', nextActive);
  }, [activeGroupId, currentUserId, sb]);

  useEffect(() => {
    if (!open) return;
    loadGroups();
  }, [open, currentUserId, loadGroups]);

  useEffect(() => {
    const runSearch = async () => {
      if (!activeGroup || !searchTerm.trim() || !currentUserId) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await sb
        .from('profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${searchTerm.trim()}%`)
        .limit(8);

      if (error) {
        console.error('User search failed:', error);
        return;
      }

      const filtered = ((data || []) as UserProfile[]).filter((user: UserProfile) => {
        if (user.user_id === currentUserId) return false;
        return !memberIds.includes(user.user_id);
      });

      setSearchResults(filtered);
    };

    runSearch();
  }, [searchTerm, activeGroup, memberIds, currentUserId, sb]);

  const refreshMembers = useCallback(async (groupId: string) => {
    const { data } = await sb
      .from('group_participants')
      .select('user_id')
      .eq('group_id', groupId);

    setMemberIds(((data || []) as GroupParticipantRow[]).map((m) => m.user_id));
  }, [sb]);

  useEffect(() => {
    if (activeGroupId) {
      refreshMembers(activeGroupId);
      localStorage.setItem('studyai_active_group_id', activeGroupId);
    }
  }, [activeGroupId, refreshMembers]);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  const handleCreateGroup = async () => {
    if (!currentUserId) {
      toast.error('Please login first.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await sb.rpc('create_study_group', {
        p_group_name: newGroupName.trim() || 'Study Group',
        p_group_system_prompt: GROUP_SYSTEM_PROMPT,
      });

      if (error) throw error;

      const result = data?.[0];
      if (!result?.group_id) throw new Error('Group creation failed');

      setCreatedCode(result.invite_code || '');
      setJoinCode(result.invite_code || '');
      setNewGroupName('');
      setActiveGroupId(result.group_id);
      localStorage.setItem('studyai_active_group_id', result.group_id);
      toast.success('Group created successfully!');
      await loadGroups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create group';
      console.error(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await sb.rpc('join_study_group_by_code', {
        p_invite_code: code,
      });

      if (error) throw error;
      const joined = data?.[0];
      if (!joined?.group_id) throw new Error('Unable to join group');

      setActiveGroupId(joined.group_id);
      localStorage.setItem('studyai_active_group_id', joined.group_id);
      toast.success(`Joined ${joined.group_name} successfully`);
      await loadGroups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('INVALID_CODE')) {
        toast.error('गलत invite code है। कृपया सही code डालें।');
      } else if (message.includes('GROUP_FULL')) {
        toast.error('इस ग्रुप में 50 members पूरे हो चुके हैं।');
      } else {
        toast.error('Group join failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (memberUserId: string) => {
    if (!activeGroup) return;

    try {
      const { error } = await sb.rpc('add_member_to_study_group', {
        p_group_id: activeGroup.id,
        p_member_user_id: memberUserId,
      });

      if (error) throw error;
      toast.success('Member invited successfully');
      await refreshMembers(activeGroup.id);
      await loadGroups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('GROUP_FULL')) {
        toast.error('इस ग्रुप में 50 members पूरे हो चुके हैं।');
      } else {
        toast.error('Member add नहीं हो पाया।');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> AI-Powered Group Study
          </DialogTitle>
          <DialogDescription>
            Create or join a group with a short invite code (example: STUDY26).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border p-3 space-y-2">
            <p className="text-sm font-medium">Join Group</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code (e.g. STUDY26)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
              <Button onClick={handleJoinGroup} disabled={loading}>Join</Button>
            </div>
          </div>

          <div className="rounded-xl border p-3 space-y-2">
            <p className="text-sm font-medium">Create Group</p>
            <div className="flex gap-2">
              <Input
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={40}
              />
              <Button onClick={handleCreateGroup} disabled={loading}>Create</Button>
            </div>

            {createdCode && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-2">
                <div>
                  <p className="text-xs text-muted-foreground">Your invite code</p>
                  <p className="font-semibold tracking-wider">{createdCode}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyCode(createdCode)}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Your Groups</p>
              {activeGroup && <Badge variant="secondary">{activeGroup.member_count}/50 members</Badge>}
            </div>

            {groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant={activeGroupId === group.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveGroupId(group.id)}
                    className="gap-2"
                  >
                    {activeGroupId === group.id ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    {group.name}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">You are not in any study group yet.</p>
            )}

            {activeGroup && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Invite code: <span className="font-semibold text-foreground">{activeGroup.invite_code}</span></p>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(activeGroup.invite_code)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Add member by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between rounded-lg border p-2">
                      <span className="text-sm">{user.display_name || user.user_id}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(user.user_id)}
                        disabled={activeGroup.member_count >= 50}
                      >
                        <UserPlus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                  {!searchResults.length && searchTerm && (
                    <p className="text-xs text-muted-foreground">No users found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupStudyModal;
