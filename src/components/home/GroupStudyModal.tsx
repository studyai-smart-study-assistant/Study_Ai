import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Search, UserPlus, Users } from 'lucide-react';

interface GroupStudyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

interface StudyGroup {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  group_system_prompt: string;
}

interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
}

interface SearchProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

const GROUP_PROMPT = 'तुम अब एक स्टडी ग्रुप में हो। यहाँ कई छात्र एक साथ पढ़ रहे हैं। तुम्हें हर छात्र के Mind Vault का एक्सेस है। तुम्हें यह पहचानना है कि किसने सवाल पूछा है और उस छात्र की पिछली पसंद/नापसंद के आधार पर जवाब देना है ताकि एक Personalized Classroom वाली फील आए।';

export default function GroupStudyModal({ open, onOpenChange, userId }: GroupStudyModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('Study Group');
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const memberCount = members.length;
  const canInviteMore = memberCount < 50;

  const existingMemberSet = useMemo(() => new Set(members.map((m) => m.user_id)), [members]);

  useEffect(() => {
    if (!open || !userId) return;
    loadCurrentMembership();
  }, [open, userId]);

  useEffect(() => {
    if (!activeGroup || !userId) return;
    loadMembers(activeGroup.id);

    const channel = supabase
      .channel(`study-group-members-${activeGroup.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_participants',
        filter: `group_id=eq.${activeGroup.id}`,
      }, () => {
        loadMembers(activeGroup.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGroup?.id, userId]);

  const loadCurrentMembership = async () => {
    if (!userId) return;

    const { data: participant, error: participantError } = await supabase
      .from('group_participants')
      .select('group_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (participantError) {
      console.error(participantError);
      return;
    }

    if (!participant?.group_id) {
      setActiveGroup(null);
      setMembers([]);
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('id, name, invite_code, creator_id, group_system_prompt')
      .eq('id', participant.group_id)
      .maybeSingle();

    if (groupError || !group) {
      setActiveGroup(null);
      return;
    }

    setActiveGroup(group as StudyGroup);
  };

  const loadMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_participants')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setMembers((data || []) as GroupMember[]);
  };

  const handleCreateGroup = async () => {
    if (!userId) {
      toast.error('Please login first to create a group.');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.rpc('create_study_group', {
      p_group_name: groupName.trim() || 'Study Group',
      p_group_system_prompt: GROUP_PROMPT,
    });
    setIsLoading(false);

    if (error || !data) {
      console.error(error);
      toast.error('Unable to create group right now.');
      return;
    }

    setActiveGroup(data as unknown as StudyGroup);
    setJoinCode('');
    toast.success('Group created successfully!');
  };

  const handleJoinGroup = async () => {
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error('Please enter a valid invite code.');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.rpc('join_study_group_by_code', {
      p_invite_code: normalizedCode,
    });
    setIsLoading(false);

    if (error || !data) {
      const message = error?.message?.includes('limit')
        ? 'This group already has 50 members.'
        : 'Invalid code. Please verify and try again.';
      toast.error(message);
      return;
    }

    setActiveGroup(data as unknown as StudyGroup);
    setJoinCode('');
    toast.success('Joined group successfully!');
  };

  const handleMemberSearch = async () => {
    if (!memberSearch.trim() || !activeGroup) return;

    setIsSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .ilike('display_name', `%${memberSearch.trim()}%`)
      .limit(8);
    setIsSearching(false);

    if (error) {
      toast.error('Unable to search users.');
      return;
    }

    const filtered = (data || []).filter((profile) => !existingMemberSet.has(profile.user_id));
    setSearchResults(filtered as SearchProfile[]);
  };

  const inviteMember = async (targetUserId: string) => {
    if (!activeGroup) return;

    if (!canInviteMore) {
      toast.error('Group member limit reached (50/50).');
      return;
    }

    const { error } = await supabase
      .from('group_participants')
      .insert({
        group_id: activeGroup.id,
        user_id: targetUserId,
        role: 'member',
      });

    if (error) {
      if (error.message?.includes('limit')) {
        toast.error('Group member limit reached (50/50).');
      } else {
        toast.error('Unable to add this member right now.');
      }
      return;
    }

    toast.success('Member added to study group.');
    setSearchResults((prev) => prev.filter((u) => u.user_id !== targetUserId));
  };

  const copyCode = async () => {
    if (!activeGroup?.invite_code) return;
    await navigator.clipboard.writeText(activeGroup.invite_code);
    toast.success('Invite code copied.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            AI-Powered Group Study
          </DialogTitle>
          <DialogDescription>
            Create or join a group using a short code, then invite classmates (max 50 members).
          </DialogDescription>
        </DialogHeader>

        {!activeGroup ? (
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join Group</TabsTrigger>
              <TabsTrigger value="create">Create Group</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-3 pt-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="Enter code (e.g., STUDY26)"
              />
              <Button className="w-full" onClick={handleJoinGroup} disabled={isLoading}>
                {isLoading ? 'Joining...' : 'Join with Code'}
              </Button>
            </TabsContent>

            <TabsContent value="create" className="space-y-3 pt-3">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={60}
                placeholder="Group name"
              />
              <Button className="w-full" onClick={handleCreateGroup} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Group'}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{activeGroup.name}</p>
                  <p className="text-xs text-muted-foreground">Invite Code</p>
                </div>
                <Badge variant="secondary" className="text-sm tracking-wide">{activeGroup.invite_code}</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={copyCode}>
                <Copy className="h-4 w-4 mr-2" /> Copy Code
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Members</p>
                <Badge variant={canInviteMore ? 'secondary' : 'destructive'}>{memberCount}/50</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search students by name"
                  disabled={!canInviteMore}
                />
                <Button variant="outline" onClick={handleMemberSearch} disabled={isSearching || !canInviteMore}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="rounded-md border p-2 space-y-2">
                  {searchResults.map((profile) => (
                    <div key={profile.user_id} className="flex items-center justify-between gap-2 p-2 rounded bg-background">
                      <div>
                        <p className="text-sm font-medium">{profile.display_name || profile.email || 'Student'}</p>
                        <p className="text-xs text-muted-foreground">{profile.email || profile.user_id.slice(0, 8)}</p>
                      </div>
                      <Button size="sm" onClick={() => inviteMember(profile.user_id)}>
                        <UserPlus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <ScrollArea className="h-36 rounded-md border p-2">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-2 rounded bg-background">
                      <span className="text-sm truncate">{member.user_id}</span>
                      <Badge variant="outline" className="capitalize">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
