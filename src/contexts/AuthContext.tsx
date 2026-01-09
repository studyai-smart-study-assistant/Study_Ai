
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended User type for backward compatibility with Firebase User properties
export interface User extends SupabaseUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

// Helper to convert Supabase user to extended User
const toExtendedUser = (user: SupabaseUser | null): User | null => {
  if (!user) return null;
  return {
    ...user,
    uid: user.id,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null,
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  };
};

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
  messageLimitReached: boolean;
  setMessageLimitReached: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageLimitReached, setMessageLimitReached] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setCurrentUser(toExtendedUser(session?.user ?? null));
        setIsLoading(false);
        
        // Sync points on login (deferred to avoid deadlock)
        if (session?.user) {
          setTimeout(() => {
            syncUserPoints(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email: string, password: string, metadata?: Record<string, any>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    if (error) throw error;
    
    // Update profile with additional info if provided
    if (data.user && metadata) {
      await supabase.from('profiles').update({
        display_name: metadata.full_name || metadata.name,
        user_category: metadata.user_category,
        education_level: metadata.education_level,
        referred_by: metadata.referral_code
      }).eq('user_id', data.user.id);
    }
    
    return data;
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
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
