import { createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth utility functions
export const authUtils = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  async signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    return { data, error };
  },

  async updateProfile(userId: string, updates: { display_name?: string; avatar_url?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  getCurrentUser() {
    return supabase.auth.getUser();
  },

  getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Helper to get authenticated user ID
export function getAuthenticatedUserId(): string | null {
  const { data: { user } } = supabase.auth.getUser();
  return user?.id || null;
}

// Helper to check if user is authenticated
export function isAuthenticated(): boolean {
  return getAuthenticatedUserId() !== null;
}

// Types for profile
export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Error messages in Hebrew
export const authErrorMessages: Record<string, string> = {
  'Invalid login credentials': 'פרטי התחברות שגויים',
  'Email not confirmed': 'יש לאמת את כתובת האימייל',
  'User already registered': 'משתמש כבר רשום במערכת',
  'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
  'Invalid email': 'כתובת אימייל לא תקינה',
  'Email rate limit exceeded': 'נשלחו יותר מדי אימיילים, נסה שוב מאוחר יותר',
  'Signup disabled': 'הרשמה מושבתת כרגע',
  'Unable to validate email address: invalid format': 'כתובת אימייל לא תקינה',
  'For security purposes, you can only request this once every 60 seconds': 'מטעמי אבטחה, ניתן לבקש פעולה זו פעם בדקה',
};

export function getErrorMessage(error: AuthError | null): string {
  if (!error) return '';
  return authErrorMessages[error.message] || error.message || 'שגיאה לא צפויה';
}