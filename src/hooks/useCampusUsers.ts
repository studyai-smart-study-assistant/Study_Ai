import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export type CampusUser = {
  id: string;
  firebase_uid: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string;
  last_seen: string | null;
};

export const useCampusUsers = (searchQuery: string = '') => {
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const syncFirebaseUserToSupabase = async (firebaseUser: any) => {
    if (!firebaseUser) return;

    try {
      // Check if user already exists in Supabase
      const { data: existingUser } = await supabase
        .from('campus_users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .maybeSingle();

      // Get real profile picture from Firebase
      const avatarUrl = firebaseUser.photoURL || 
                       firebaseUser.avatar_url || 
                       firebaseUser.profile_picture ||
                       `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`;

      if (!existingUser) {
        // Insert new user
        await supabase.from('campus_users').insert({
          firebase_uid: firebaseUser.uid,
          display_name: firebaseUser.displayName || `User_${firebaseUser.uid.substring(0, 5)}`,
          email: firebaseUser.email,
          avatar_url: avatarUrl,
          status: 'online'
        });
      } else {
        // Update existing user with latest avatar and status
        await supabase
          .from('campus_users')
          .update({ 
            status: 'online', 
            last_seen: new Date().toISOString(),
            avatar_url: avatarUrl,
            display_name: firebaseUser.displayName || existingUser.display_name
          })
          .eq('firebase_uid', firebaseUser.uid);
      }
    } catch (error) {
      console.error('Error syncing user to Supabase:', error);
    }
  };

  const fetchAndSyncUsers = async () => {
    try {
      setLoading(true);

      // 1) Fetch Firebase users fast
      const fbSnap = await get(ref(database, 'users'));
      if (!fbSnap.exists()) {
        setUsers([]);
        return;
      }
      const fbUsers = fbSnap.val() as Record<string, any>;
      const entries = Object.entries(fbUsers) as [string, any][];
      const uids = entries.map(([uid]) => uid);

      // 2) Fetch Supabase profile avatars in a single batched query
      const { data: profileRows, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, avatar_url')
        .in('user_id', uids);

      const avatarMap = new Map<string, string | null>();
      if (!profilesError && profileRows) {
        for (const row of profileRows as any[]) {
          avatarMap.set(row.user_id, row.avatar_url ?? null);
        }
      }

      // 3) Fetch campus_users for real-time status
      const { data: campusUsers } = await supabase
        .from('campus_users')
        .select('firebase_uid, status, last_seen');

      const statusMap = new Map<string, { status: string; last_seen: string | null }>();
      if (campusUsers) {
        for (const user of campusUsers) {
          statusMap.set(user.firebase_uid, {
            status: user.status || 'offline',
            last_seen: user.last_seen
          });
        }
      }

      // 4) Build list using Firebase names + Supabase avatars + real status
      let list: CampusUser[] = entries.map(([uid, u]: [string, any]) => {
        const statusData = statusMap.get(uid) || { status: 'offline', last_seen: null };
        return {
          id: uid,
          firebase_uid: uid,
          display_name: u.displayName || `User_${uid.substring(0, 5)}`,
          email: u.email || null,
          avatar_url: avatarMap.get(uid) ?? u.photoURL ?? u.avatar_url ?? u.profile_picture ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
          status: statusData.status,
          last_seen: statusData.last_seen,
        };
      }).filter(u => u.firebase_uid !== currentUser?.uid);

      // 5) Sort by online status (online users first)
      list.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        return 0;
      });

      // 6) Apply search locally for speed
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter(u =>
          (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
        );
      }

      setUsers(list);
    } catch (error) {
      console.error('Error in fetchAndSyncUsers:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSyncUsers();
  }, [searchQuery, currentUser]);

  // Set up real-time subscription for user and avatar updates
  useEffect(() => {
    const channel = supabase
      .channel('campus-users-and-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campus_users'
        },
        () => {
          fetchAndSyncUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchAndSyncUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery, currentUser]);

  return { users, loading, refetch: fetchAndSyncUsers };
};