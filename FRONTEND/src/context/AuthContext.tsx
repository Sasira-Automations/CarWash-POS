import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured as isConfigured } from '../lib/supabaseClient';

export interface OwnerUser {
  id: string;
  email: string;
  fullName?: string;
  businessName?: string;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  businessName?: string;
}

interface AuthResponse {
  error: string | null;
  requiresEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: OwnerUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signUp: (params: SignUpParams) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const formatOwnerUser = (user: User | null): OwnerUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
    businessName: user.user_metadata?.business_name || 'Sparkle Wash'
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<OwnerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!error && initialSession) {
        setSession(initialSession);
        setUser(formatOwnerUser(initialSession.user));
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error fetching auth session:', err);
      setIsLoading(false);
    });

    // 2. Realtime auth state listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(formatOwnerUser(currentSession?.user || null));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(formatOwnerUser(data.session.user));
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    if (!isConfigured) {
      return { error: 'Authentication is unavailable. Check your Supabase configuration.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      return { error: error?.message || null };
    } catch (err: any) {
      return { error: err.message || 'Unable to continue with Google.' };
    }
  };

  const signUp = async ({
    email,
    password,
    fullName,
    businessName
  }: SignUpParams): Promise<AuthResponse> => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            business_name: businessName?.trim() || 'Sparkle Wash'
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      // If Supabase has email confirmation enabled, session will be null until user clicks the email link
      const requiresEmailConfirmation = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(formatOwnerUser(data.session.user));
      }

      return { error: null, requiresEmailConfirmation };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign up.' };
    }
  };

  const signOut = async () => {
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
        signIn,
        signInWithGoogle,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
