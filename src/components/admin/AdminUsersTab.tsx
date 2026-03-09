import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Ban, CheckCircle, Search, Users, Crown, RefreshCw, Edit2, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface EnrichedUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  provider: string | null;
  auth_provider: string | null;
  created_at: string | null;
  last_login: string | null;
  last_sign_in: string | null;
  is_blocked: boolean;
  confirmed: boolean;
  level: number | null;
  points: number | null;
  current_streak: number | null;
  balance: number;
  xp: number;
  level_pts: number;
  credits: number;
  roles: string[];
  user_category: string | null;
  education_level: string | null;
  referral_code: string | null;
}

const AdminUsersTab = () => {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const [newPoints, setNewPoints] = useState('');
  const [memoriesUser, setMemoriesUser] = useState<EnrichedUser | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      toast.error('Users load करने में error आया');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'block', userId, blocked: !currentlyBlocked },
      });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_blocked: !currentlyBlocked } : u));
      toast.success(currentlyBlocked ? 'User unblocked' : 'User blocked');
    } catch {
      toast.error('Action failed');
    }
  };

  const updatePoints = async (userId: string) => {
    const pts = parseInt(newPoints);
    if (isNaN(pts)) return;
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_points', userId, points: pts },
      });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, balance: pts } : u));
      setEditingPoints(null);
      toast.success('Points updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const viewMemories = async (user: EnrichedUser) => {
    setMemoriesUser(user);
    setMemoriesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'get_memories', userId: user.user_id },
      });
      if (error) throw error;
      setMemories(data.memories || []);
    } catch {
      toast.error('Memories load नहीं हुई');
    } finally {
      setMemoriesLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.display_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q)) || u.user_id.toLowerCase().includes(q);
  });

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateShort = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card>
          <CardContent className="p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Users className="h-3 w-3" /> Total</div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><CheckCircle className="h-3 w-3 text-green-500" /> Active</div>
            <p className="text-xl md:text-2xl font-bold text-green-500">{users.filter(u => !u.is_blocked).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Ban className="h-3 w-3 text-red-500" /> Blocked</div>
            <p className="text-xl md:text-2xl font-bold text-red-500">{users.filter(u => u.is_blocked).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Crown className="h-3 w-3 text-yellow-500" /> Admins</div>
            <p className="text-xl md:text-2xl font-bold text-yellow-500">{users.filter(u => u.roles.includes('admin')).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email / Provider</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Points / XP</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No users found</TableCell>
                  </TableRow>
                ) : filtered.map(user => (
                  <TableRow key={user.user_id} className={user.is_blocked ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {(user.photo_url || user.avatar_url) ? (
                            <img src={user.photo_url || user.avatar_url!} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">{(user.display_name || '?')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{user.display_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{user.user_id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{user.email || '-'}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">{user.auth_provider || user.provider || 'email'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.last_sign_in || user.last_login)}</TableCell>
                    <TableCell>
                      {editingPoints === user.user_id ? (
                        <div className="flex items-center gap-1">
                          <Input type="number" value={newPoints} onChange={e => setNewPoints(e.target.value)} className="w-20 h-7 text-xs" />
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => updatePoints(user.user_id)}>✓</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingPoints(null)}>✕</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground">{user.balance}</span>
                          <span className="text-xs text-muted-foreground">/ {user.xp} XP</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingPoints(user.user_id); setNewPoints(user.balance.toString()); }}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">Lv.{user.level_pts}</Badge></TableCell>
                    <TableCell><span className="text-sm text-foreground">{user.current_streak || 0}🔥</span></TableCell>
                    <TableCell>
                      {user.is_blocked ? (
                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                      ) : user.roles.includes('admin') ? (
                        <Badge className="bg-yellow-500/10 text-yellow-500 text-xs"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-500 text-xs">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => viewMemories(user)}>
                          <Brain className="h-3 w-3 mr-1" /> Memories
                        </Button>
                        <Button size="sm" variant={user.is_blocked ? 'outline' : 'destructive'} className="h-7 text-xs" onClick={() => toggleBlock(user.user_id, user.is_blocked)}>
                          {user.is_blocked ? 'Unblock' : 'Block'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No users found</p>
        ) : filtered.map(user => (
          <Card key={user.user_id} className={user.is_blocked ? 'opacity-60' : ''}>
            <CardContent className="p-3">
              {/* User header */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {(user.photo_url || user.avatar_url) ? (
                    <img src={user.photo_url || user.avatar_url!} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{(user.display_name || '?')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{user.display_name || 'Unknown'}</p>
                    {user.is_blocked ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Blocked</Badge>
                    ) : user.roles.includes('admin') ? (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[10px] px-1.5 py-0">Admin</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email || '-'}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                <div className="text-center p-1.5 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Points</p>
                  <p className="text-sm font-bold text-foreground">{user.balance}</p>
                </div>
                <div className="text-center p-1.5 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">XP</p>
                  <p className="text-sm font-bold text-foreground">{user.xp}</p>
                </div>
                <div className="text-center p-1.5 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-sm font-bold text-foreground">{user.level_pts}</p>
                </div>
                <div className="text-center p-1.5 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-sm font-bold text-foreground">{user.current_streak || 0}🔥</p>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
                <span>Joined: {formatDateShort(user.created_at)}</span>
                <Badge variant="outline" className="text-[10px]">{user.auth_provider || user.provider || 'email'}</Badge>
              </div>

              {/* Points editing */}
              {editingPoints === user.user_id && (
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Input type="number" value={newPoints} onChange={e => setNewPoints(e.target.value)} className="h-8 text-xs flex-1" placeholder="New points" />
                  <Button size="sm" className="h-8 px-3 text-xs" onClick={() => updatePoints(user.user_id)}>Save</Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setEditingPoints(null)}>✕</Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => viewMemories(user)}>
                  <Brain className="h-3 w-3 mr-1" /> Memories
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setEditingPoints(user.user_id); setNewPoints(user.balance.toString()); }}>
                  <Edit2 className="h-3 w-3 mr-1" /> Points
                </Button>
                <Button size="sm" variant={user.is_blocked ? 'outline' : 'destructive'} className="h-7 text-xs" onClick={() => toggleBlock(user.user_id, user.is_blocked)}>
                  {user.is_blocked ? 'Unblock' : 'Block'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Memories Dialog */}
      <Dialog open={!!memoriesUser} onOpenChange={(open) => !open && setMemoriesUser(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <Brain className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              {memoriesUser?.display_name || 'User'} की Memories
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            {memoriesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : memories.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">कोई memory store नहीं है</p>
            ) : (
              <div className="space-y-2.5 pr-2 md:pr-4">
                {memories.map((m) => (
                  <div key={m.id} className="p-2.5 md:p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <Badge variant="outline" className="text-[10px] md:text-xs">{m.category}</Badge>
                      <Badge variant="secondary" className="text-[10px] md:text-xs">imp: {m.importance}</Badge>
                      <Badge variant="secondary" className="text-[10px] md:text-xs">{m.source}</Badge>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-foreground">{m.memory_key}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{m.memory_value}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5">
                      {new Date(m.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersTab;
