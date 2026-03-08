
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  onStartChat: (uid: string, name: string, avatar?: string | null) => void;
  searchQuery: string;
}

interface CampusUser {
  firebase_uid: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string | null;
  last_seen: string | null;
  referral_code: string | null;
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];

const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

const CampusTalkUsersList: React.FC<Props> = ({ onStartChat, searchQuery }) => {
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      // Load profiles for accurate names + referral codes
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, photo_url, email, referral_code');

      const { data: campusUsers } = await supabase
        .from('campus_users')
        .select('firebase_uid, display_name, avatar_url, status, last_seen');

      const userMap = new Map<string, CampusUser>();

      profiles?.forEach(p => {
        userMap.set(p.user_id, {
          firebase_uid: p.user_id,
          display_name: p.display_name || p.email || p.user_id.slice(0, 8),
          avatar_url: p.avatar_url || p.photo_url,
          status: null,
          last_seen: null,
          referral_code: p.referral_code || null,
        });
      });

      campusUsers?.forEach(u => {
        const existing = userMap.get(u.firebase_uid);
        userMap.set(u.firebase_uid, {
          firebase_uid: u.firebase_uid,
          display_name: existing?.display_name || u.display_name || u.firebase_uid.slice(0, 8),
          avatar_url: existing?.avatar_url || u.avatar_url,
          status: u.status,
          last_seen: u.last_seen,
          referral_code: existing?.referral_code || null,
        });
      });

      if (currentUser) userMap.delete(currentUser.uid);

      setUsers(Array.from(userMap.values()));
      setLoading(false);
    };

    loadUsers();
  }, [currentUser]);

  const effectiveSearch = (localSearch || searchQuery).toLowerCase();
  const filtered = effectiveSearch
    ? users.filter(u => 
        (u.display_name || '').toLowerCase().includes(effectiveSearch) ||
        (u.referral_code || '').toLowerCase().includes(effectiveSearch)
      )
    : users;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="नाम या unique code से search करें..."
            className="pl-9 rounded-full bg-muted border-0"
          />
        </div>
      </div>

      <div className="px-4 py-2 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          All Users ({filtered.length})
        </p>
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            कोई user नहीं मिला 🔍
          </div>
        ) : (
          filtered.map((user) => {
            const name = user.display_name || 'Unknown';
            return (
              <div
                key={user.firebase_uid}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="relative shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className={`w-11 h-11 rounded-full ${getColor(name)} flex items-center justify-center text-white font-bold text-lg`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {user.referral_code && <span className="font-mono">{user.referral_code} · </span>}
                    {user.status === 'online' ? '🟢 Online' : 'Tap to chat'}
                  </p>
                </div>
                <button
                  onClick={() => onStartChat(user.firebase_uid, name, user.avatar_url)}
                  className="shrink-0 p-2 rounded-full bg-[hsl(230,70%,55%)] text-white hover:bg-[hsl(230,70%,45%)] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CampusTalkUsersList;
