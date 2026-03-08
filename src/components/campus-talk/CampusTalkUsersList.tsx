
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle } from 'lucide-react';

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
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      // Load from both campus_users and profiles tables
      const { data: campusUsers } = await supabase
        .from('campus_users')
        .select('firebase_uid, display_name, avatar_url, status, last_seen');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, email');

      // Merge: prefer campus_users, fill gaps from profiles
      const userMap = new Map<string, CampusUser>();

      profiles?.forEach(p => {
        userMap.set(p.user_id, {
          firebase_uid: p.user_id,
          display_name: p.display_name || p.email || p.user_id.slice(0, 8),
          avatar_url: p.avatar_url,
          status: null,
          last_seen: null,
        });
      });

      campusUsers?.forEach(u => {
        userMap.set(u.firebase_uid, {
          ...u,
          display_name: u.display_name || userMap.get(u.firebase_uid)?.display_name || u.firebase_uid.slice(0, 8),
        });
      });

      // Remove current user
      if (currentUser) userMap.delete(currentUser.uid);

      setUsers(Array.from(userMap.values()));
      setLoading(false);
    };

    loadUsers();
  }, [currentUser]);

  const filtered = searchQuery
    ? users.filter(u => (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : users;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      <div className="px-4 py-2 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          All Users ({filtered.length})
        </p>
      </div>
      {filtered.map((user) => {
        const name = user.display_name || 'Unknown';
        return (
          <div
            key={user.firebase_uid}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={name}
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className={`w-11 h-11 rounded-full ${getColor(name)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{name}</h3>
              <p className="text-xs text-muted-foreground">
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
      })}
    </div>
  );
};

export default CampusTalkUsersList;
