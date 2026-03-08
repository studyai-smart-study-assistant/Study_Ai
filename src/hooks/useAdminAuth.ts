import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.uid)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdmin();
  }, [currentUser, authLoading]);

  return { isAdmin, isChecking, currentUser };
};
