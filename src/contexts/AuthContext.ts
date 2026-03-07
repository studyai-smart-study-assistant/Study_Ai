
import { createContext } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended User type for backward compatibility with Firebase User properties
export interface User extends SupabaseUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
