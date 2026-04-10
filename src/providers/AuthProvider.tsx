
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AuthContext, User } from '@/contexts/AuthContext';

// Helper to convert Supabase user to extended User
const toExtendedUser = (user: any): User | null => {
  if (!user) return null;
  return {
    ...user,
    uid: user.id,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null,
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageLimitReached, setMessageLimitReached] = useState(false);

  useEffect(() => {
    const isRecoverableAuthError = (error: unknown): boolean => {
      const authError = error as { status?: number; message?: string } | null;
      if (!authError) return true;

      // Network and temporary server issues should not force local sign-out.
      if (typeof authError.status !== 'number') return true;
      return authError.status >= 500;
    };

    const refreshOrRecover = async (
      fallbackSession: Session | null,
      options?: { requireFreshSession?: boolean }
    ): Promise<Session | null> => {
      const requireFreshSession = options?.requireFreshSession ?? false;
      const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshedData.session) {
        if (requireFreshSession) {
          await supabase.auth.signOut({ scope: 'local' });
          return null;
        }

        if (isRecoverableAuthError(refreshError)) {
          return fallbackSession;
        }

        await supabase.auth.signOut({ scope: 'local' });
        return null;
      }
      return refreshedData.session;
    };

    const reconcileSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let activeSession = session;
      const nowMs = Date.now();
      const refreshWindowMs = 5 * 60 * 1000;
      const isExpired = Boolean(session?.expires_at && session.expires_at * 1000 <= nowMs);
      const isMissingOrExpiringSoon =
        !session?.expires_at || (session.expires_at * 1000 - nowMs) <= refreshWindowMs;

      if (session && isMissingOrExpiringSoon) {
        activeSession = await refreshOrRecover(session, { requireFreshSession: isExpired });
      } else if (session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          activeSession = await refreshOrRecover(session);
        }
      }

      console.log('Session reconciled:', activeSession?.user?.id?.substring(0, 8) || 'none');
      setSession(activeSession);
      setCurrentUser(toExtendedUser(activeSession?.user ?? null));
      setIsLoading(false);
    };

    const reconcileSessionSafely = () => {
      reconcileSession().catch((error) => {
        console.error('Session reconcile failed:', error);
        setSession(null);
        setCurrentUser(null);
        setIsLoading(false);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconcileSessionSafely();
      }
    };

    // CRITICAL: Set up onAuthStateChange BEFORE getSession
    // This ensures we catch all auth events including session restoration
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id?.substring(0, 8));
        setSession(session);
        setCurrentUser(toExtendedUser(session?.user ?? null));
        setIsLoading(false);

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setTimeout(() => {
            syncUserPoints(session.user.id);
          }, 0);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setCurrentUser(null);
          return;
        }
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock in auth callback
          setTimeout(() => {
            syncUserPoints(session.user.id);
          }, 0);
        }
      }
    );

    // Then restore session from storage
    reconcileSessionSafely();
    window.addEventListener('focus', reconcileSessionSafely);
    window.addEventListener('online', reconcileSessionSafely);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const sessionHealthInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        reconcileSessionSafely();
      }
    }, 2 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', reconcileSessionSafely);
      window.removeEventListener('online', reconcileSessionSafely);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(sessionHealthInterval);
    };
  }, []);

  const syncUserPoints = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('points-balance', {
        body: { userId }
      });
      
      if (!error && data) {
        localStorage.setItem(`${userId}_points`, data.balance?.toString() || '0');
        localStorage.setItem(`${userId}_level`, data.level?.toString() || '1');
      }
    } catch (error) {
      console.error('Error syncing points:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
    setSession(null);
  };

  const value = {
    currentUser,
    session,
    login,
    signup,
    signInWithGoogle,
    logout,
    isLoading,
    messageLimitReached,
    setMessageLimitReached
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
