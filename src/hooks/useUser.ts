
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserDetails {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  points: number | null;
  level: number | null;
}

export const useUser = () => {
  const { currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async () => {
    if (!currentUser?.uid) {
      setUserDetails(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, email, points, level')
        .eq('user_id', currentUser.uid)
        .single();

      if (error) throw error;
      setUserDetails({
        full_name: data?.display_name || null,
        avatar_url: data?.avatar_url || null,
        email: data?.email || currentUser.email || null,
        points: data?.points || 0,
        level: data?.level || 1,
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      setUserDetails({
        full_name: currentUser.displayName || null,
        avatar_url: currentUser.photoURL || null,
        email: currentUser.email || null,
        points: 0,
        level: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const updateUserDetails = useCallback(async (updates: { full_name?: string }) => {
    if (!currentUser?.uid) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: updates.full_name, updated_at: new Date().toISOString() })
      .eq('user_id', currentUser.uid);
    if (error) throw error;
    await fetchUserDetails();
  }, [currentUser, fetchUserDetails]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!currentUser?.uid) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop();
    const filePath = `${currentUser.uid}/avatar.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', currentUser.uid);
    if (updateError) throw updateError;

    await fetchUserDetails();
    return avatarUrl;
  }, [currentUser, fetchUserDetails]);

  const deleteAvatar = useCallback(async () => {
    if (!currentUser?.uid) throw new Error('Not authenticated');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('user_id', currentUser.uid);
    if (updateError) throw updateError;
    await fetchUserDetails();
  }, [currentUser, fetchUserDetails]);

  return {
    user: currentUser ? { email: currentUser.email, uid: currentUser.uid } : null,
    userDetails,
    loading,
    updateUserDetails,
    uploadAvatar,
    deleteAvatar,
    refetch: fetchUserDetails,
  };
};
