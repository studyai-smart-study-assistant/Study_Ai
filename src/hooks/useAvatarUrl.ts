import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAvatarUrl = (userId: string | undefined) => {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const fetchAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data?.avatar_url && isMounted) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        // Silent fail - fallback avatar will be used
        console.error('Failed to fetch avatar URL:', err);
      }
    };

    fetchAvatar();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { avatarUrl };
};
