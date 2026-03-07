
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setCurrentUser(toExtendedUser(session?.user ?? null));
        setIsLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            syncUserPoints(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(toExtendedUser(session?.user ?? null));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
