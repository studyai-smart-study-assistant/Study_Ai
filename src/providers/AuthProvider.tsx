import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AuthContext, User } from '@/contexts/AuthContext';
import { cleanupStorage, clearNonEssentialStorage, isQuotaExceededError } from '@/lib/storage/cleanupStorage';
import { safeInvokeWithAuthRetry } from '@/lib/auth/sessionRecovery';
import { migrateLegacyChatsToCloud } from '@/lib/chat/chat-migration';

const toExtendedUser = (user: any): User | null => {
  if (!user) return null;
  return {
    ...user,
    uid: user.id,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null,
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const migrationInProgressRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const forceCleanSignOut = async () => {
      cleanupStorage();
      clearNonEssentialStorage();
      await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      setCurrentUser(null);
      alert('Storage full, clearing cache...');
    };

    const isRecoverableAuthError = (error: unknown): boolean => {
      const authError = error as { status?: number; message?: string } | null;
      if (!authError) return true;
      if (typeof authError.status !== 'number') return true;
      return authError.status >= 500;
    };

    const refreshOrRecover = async (
      fallbackSession: Session | null,
      options?: { requireFreshSession?: boolean }
    ): Promise<Session | null> => {
      const requireFreshSession = options?.requireFreshSession ?? false;
      try {
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
      } catch (error) {
        if (isQuotaExceededError(error)) {
          await forceCleanSignOut();
          return null;
        }
        throw error;
      }
    };

    const reconcileSession = async (options?: { serverFirst?: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      let activeSession = session;
      const nowMs = Date.now();
      const refreshWindowMs = 5 * 60 * 1000;
      const isExpired = Boolean(session?.expires_at && session.expires_at * 1000 <= nowMs);
      const isMissingOrExpiringSoon = !session?.expires_at || (session.expires_at * 1000 - nowMs) <= refreshWindowMs;

      if (session && (options?.serverFirst || !session.user)) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          activeSession = await refreshOrRecover(session, { requireFreshSession: true });
        }
      } else if (session && isMissingOrExpiringSoon) {
        activeSession = await refreshOrRecover(session, { requireFreshSession: isExpired });
      } else if (session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          activeSession = await refreshOrRecover(session);
        }
      }

      setSession(activeSession);
      setCurrentUser(toExtendedUser(activeSession?.user ?? null));
      setIsLoading(false);
    };

    const reconcileSessionSafely = (options?: { serverFirst?: boolean }) => {
      reconcileSession(options).catch((error) => {
        console.error('Session reconcile failed:', error);
        // Keep last known auth state on transient failures (offline/network hiccups).
        // Auth state will still be updated by onAuthStateChange when a real sign-out happens.
        setIsLoading(false);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconcileSessionSafely({ serverFirst: true });
      }
    };

    const handleFocus = () => reconcileSessionSafely({ serverFirst: true });
    const handleOnline = () => reconcileSessionSafely({ serverFirst: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setCurrentUser(toExtendedUser(session?.user ?? null));
      setIsLoading(false);

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setTimeout(() => {
          void syncUserPoints(session.user.id);
          void migrateLegacyChats(session.user.id);
        }, 0);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUser(null);
        return;
      }

      if (session?.user) {
        setTimeout(() => {
          void syncUserPoints(session.user.id);
          void migrateLegacyChats(session.user.id);
        }, 0);
      }
    });

    reconcileSessionSafely({ serverFirst: true });
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const sessionHealthInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        reconcileSessionSafely({ serverFirst: true });
      }
    }, 2 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(sessionHealthInterval);
    };
  }, []);

  const syncUserPoints = async (userId: string) => {
    try {
      const { data, error } = await safeInvokeWithAuthRetry(
        (body) => supabase.functions.invoke('points-balance', { body }),
        { userId }
      );

      if (!error && data) {
        localStorage.setItem(`${userId}_points`, data.balance?.toString() || '0');
        localStorage.setItem(`${userId}_level`, data.level?.toString() || '1');
      }
    } catch (error) {
      console.error('Error syncing points:', error);
    }
  };

  const migrateLegacyChats = async (userId: string) => {
    if (!userId) return;
    if (migrationInProgressRef.current.has(userId)) return;

    try {
      migrationInProgressRef.current.add(userId);
      await migrateLegacyChatsToCloud(userId);
    } catch (error) {
      console.error('Error migrating legacy chats:', error);
    } finally {
      migrationInProgressRef.current.delete(userId);
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
      options: { data: metadata },
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
    setMessageLimitReached,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
