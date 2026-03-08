
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, UserPlus, UserMinus, Shield, ShieldCheck, Crown, Lock, Unlock, Pencil, Check, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { CampusGroup } from './CampusTalkGroupList';

interface Member {
  user_uid: string;
  role: string;
  display_name?: string;
  avatar_url?: string | null;
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
  group: CampusGroup;
  myRole: string;
  onBack: () => void;
  onGroupUpdated: () => void;
}

const CampusTalkGroupSettings: React.FC<Props> = ({ group, myRole, onBack, onGroupUpdated }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [groupDesc, setGroupDesc] = useState(group.description || '');
  const [onlyAdminsSend, setOnlyAdminsSend] = useState(group.only_admins_send);
  const [onlyAdminsAdd, setOnlyAdminsAdd] = useState(group.only_admins_add_members);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwnerOrAdmin = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    loadMembers();
  }, [group.id]);

  const loadMembers = async () => {
    const { data: memberData } = await supabase
      .from('campus_group_members' as any)
      .select('user_uid, role')
      .eq('group_id', group.id);

    if (!memberData) return;

    const uids = (memberData as any[]).map((m: any) => m.user_uid);
    const { data: profiles } = await supabase
      .from('campus_users')
      .select('firebase_uid, display_name, avatar_url')
      .in('firebase_uid', uids);

    const enriched = (memberData as any[]).map((m: any) => {
      const p = (profiles || []).find(x => x.firebase_uid === m.user_uid);
      return {
        ...m,
        display_name: p?.display_name || m.user_uid.slice(0, 8),
        avatar_url: p?.avatar_url,
      };
    });

    // Sort: owner first, then admin, then member
    enriched.sort((a, b) => {
      const order: Record<string, number> = { owner: 0, admin: 1, member: 2 };
      return (order[a.role] || 3) - (order[b.role] || 3);
    });

    setMembers(enriched);
  };

  const handleUpdateGroup = async () => {
    if (!isOwnerOrAdmin) return;
    setSaving(true);
    try {
      await supabase
        .from('campus_groups' as any)
        .update({
          name: groupName.trim(),
          description: groupDesc.trim() || null,
          only_admins_send: onlyAdminsSend,
          only_admins_add_members: onlyAdminsAdd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id);

      toast.success('Group अपडेट हो गया ✅');
      setEditingName(false);
      onGroupUpdated();
    } catch (err: any) {
      toast.error('Update error: ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnerOrAdmin) return;
    try {
      const path = `group-avatars/${group.id}/${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('chat_media').upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from('chat_media').getPublicUrl(path);
      await supabase.from('campus_groups' as any).update({ avatar_url: publicUrl }).eq('id', group.id);
      toast.success('Group photo अपडेट हुआ!');
    } catch { toast.error('Photo upload error'); }
  };

  const handleMakeAdmin = async (uid: string) => {
    if (!isOwnerOrAdmin) return;
    await supabase.from('campus_group_members' as any).update({ role: 'admin' }).eq('group_id', group.id).eq('user_uid', uid);
    toast.success('Admin बना दिया!');
    loadMembers();
  };

  const handleRemoveAdmin = async (uid: string) => {
    if (myRole !== 'owner') return;
    await supabase.from('campus_group_members' as any).update({ role: 'member' }).eq('group_id', group.id).eq('user_uid', uid);
    toast.success('Admin हटा दिया');
    loadMembers();
  };

  const handleRemoveMember = async (uid: string) => {
    if (!isOwnerOrAdmin) return;
    await supabase.from('campus_group_members' as any).delete().eq('group_id', group.id).eq('user_uid', uid);
    toast.success('Member हटा दिया');
    loadMembers();
  };

  const handleLeaveGroup = async () => {
    if (!currentUser) return;
    await supabase.from('campus_group_members' as any).delete().eq('group_id', group.id).eq('user_uid', currentUser.uid);
    toast.success('Group छोड़ दिया');
    onBack();
  };

  const loadAllUsers = async () => {
    const { data } = await supabase
      .from('campus_users')
      .select('firebase_uid, display_name, avatar_url');
    const memberUids = new Set(members.map(m => m.user_uid));
    setAllUsers((data || []).filter(u => !memberUids.has(u.firebase_uid)));
    setShowAddMember(true);
  };

  const handleAddMember = async (uid: string) => {
    try {
      await supabase.from('campus_group_members' as any).insert({
        group_id: group.id,
        user_uid: uid,
        role: 'member',
      });
      toast.success('Member जोड़ दिया!');
      setShowAddMember(false);
      loadMembers();
    } catch { toast.error('Error adding member'); }
  };

  const canAddMembers = !group.only_admins_add_members || isOwnerOrAdmin;

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
    if (role === 'admin') return <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />;
    return null;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'owner') return <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded-full">Owner</span>;
    if (role === 'admin') return <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full">Admin</span>;
    return null;
  };

  if (showAddMember) {
    const filteredUsers = allUsers.filter(u =>
      !addSearch || (u.display_name || '').toLowerCase().includes(addSearch.toLowerCase())
    );
    return (
      <div className="flex flex-col h-[100dvh] bg-background">
        <div className="bg-[hsl(230,70%,55%)] text-white px-3 py-2.5 flex items-center gap-3 shrink-0">
          <button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-white/10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold text-sm">Member जोड़ें</h2>
        </div>
        <div className="p-3">
          <Input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Search..." className="bg-muted border-0" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredUsers.map(u => {
            const n = u.display_name || u.firebase_uid.slice(0, 8);
            return (
              <button key={u.firebase_uid} onClick={() => handleAddMember(u.firebase_uid)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={n} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${getColor(n)} flex items-center justify-center text-white font-bold`}>
                    {n.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">{n}</p>
                <UserPlus className="h-4 w-4 text-muted-foreground ml-auto" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="bg-[hsl(230,70%,55%)] text-white px-3 py-2.5 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-sm">Group Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group Info */}
        <div className="flex flex-col items-center p-6 space-y-3">
          <div className="relative">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt={group.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className={`w-20 h-20 rounded-full ${getColor(group.name)} flex items-center justify-center text-white font-bold text-3xl`}>
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
            {isOwnerOrAdmin && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[hsl(230,70%,55%)] text-white p-1.5 rounded-full"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {editingName ? (
            <div className="w-full max-w-xs space-y-2">
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} className="text-center" autoFocus />
              <Input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Description..." className="text-center" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingName(false)} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={handleUpdateGroup} disabled={saving} className="flex-1 bg-[hsl(230,70%,55%)]">{saving ? '...' : 'Save'}</Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <h2 className="text-xl font-bold text-foreground">{groupName}</h2>
                {isOwnerOrAdmin && (
                  <button onClick={() => setEditingName(true)} className="p-1 hover:bg-muted rounded-full">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              {groupDesc && <p className="text-sm text-muted-foreground mt-1">{groupDesc}</p>}
              <p className="text-xs text-muted-foreground mt-1">{members.length} members</p>
            </div>
          )}
        </div>

        {/* Settings (admin/owner only) */}
        {isOwnerOrAdmin && (
          <div className="px-4 space-y-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Settings</h3>
            <div className="bg-muted/50 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">सिर्फ Admin message भेज सकें</span>
                </div>
                <Switch checked={onlyAdminsSend} onCheckedChange={(v) => { setOnlyAdminsSend(v); }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">सिर्फ Admin member जोड़ सकें</span>
                </div>
                <Switch checked={onlyAdminsAdd} onCheckedChange={(v) => { setOnlyAdminsAdd(v); }} />
              </div>
              <Button size="sm" onClick={handleUpdateGroup} disabled={saving} className="w-full bg-[hsl(230,70%,55%)]">
                {saving ? 'Saving...' : 'Settings Save करें'}
              </Button>
            </div>
          </div>
        )}

        {/* Add Member */}
        {canAddMembers && (
          <div className="px-4 mb-3">
            <Button variant="outline" onClick={loadAllUsers} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" /> Member जोड़ें
            </Button>
          </div>
        )}

        {/* Members */}
        <div className="px-4 mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Members ({members.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {members.map(m => {
            const n = m.display_name || m.user_uid.slice(0, 8);
            const isMe = m.user_uid === currentUser?.uid;
            return (
              <div key={m.user_uid} className="flex items-center gap-3 px-4 py-2.5">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={n} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${getColor(n)} flex items-center justify-center text-white font-bold`}>
                    {n.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{n} {isMe && '(You)'}</p>
                    {getRoleIcon(m.role)}
                  </div>
                  {getRoleBadge(m.role)}
                </div>
                {/* Actions */}
                {isOwnerOrAdmin && !isMe && m.role !== 'owner' && (
                  <div className="flex items-center gap-1">
                    {m.role === 'member' && (
                      <button onClick={() => handleMakeAdmin(m.user_uid)} className="p-1.5 hover:bg-muted rounded-full" title="Make Admin">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      </button>
                    )}
                    {m.role === 'admin' && myRole === 'owner' && (
                      <button onClick={() => handleRemoveAdmin(m.user_uid)} className="p-1.5 hover:bg-muted rounded-full" title="Remove Admin">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <button onClick={() => handleRemoveMember(m.user_uid)} className="p-1.5 hover:bg-muted rounded-full" title="Remove">
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leave group */}
        {myRole !== 'owner' && (
          <div className="p-4">
            <Button variant="destructive" onClick={handleLeaveGroup} className="w-full">
              <LogOut className="h-4 w-4 mr-2" /> Group छोड़ें
            </Button>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
};

export default CampusTalkGroupSettings;
