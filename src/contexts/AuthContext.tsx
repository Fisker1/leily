import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/integrations/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';
import { useRateLimit } from '@/shared/hooks/useRateLimit';
import { useAccountCreatedEmail, useEmailVerificationEmail, usePasswordResetEmail } from '@/shared/hooks/useEmailService';

// Check if we're running in local mode (no Supabase configured)
const isLocalMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_end: string | null;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'facebook') => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ─── Local user for offline / local-only mode ─────────────────────────────
const LOCAL_USER: User = {
  id: 'local-user',
  email: 'me@leily.local',
  app_metadata: {},
  user_metadata: { full_name: 'Leily Admin' },
  aud: 'authenticated',
  created_at: '2018-01-01T10:00:00Z',
} as User;

const LOCAL_SESSION: Session = {
  access_token: 'local-token',
  refresh_token: 'local-refresh',
  expires_in: 999999,
  token_type: 'bearer',
  user: LOCAL_USER,
} as Session;

const LOCAL_PROFILE: Profile = {
  id: 'local-user',
  email: 'me@leily.local',
  full_name: 'Leily Admin',
  avatar_url: null,
  subscription_tier: 'premium',
  subscription_end: null,
  credits: 9999,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  const { sendAccountCreatedEmail } = useAccountCreatedEmail();
  const { sendEmailVerificationEmail } = useEmailVerificationEmail();
  const { sendPasswordResetEmail } = usePasswordResetEmail();
  const [user, setUser] = useState<User | null>(isLocalMode ? LOCAL_USER : null);
  const [session, setSession] = useState<Session | null>(isLocalMode ? LOCAL_SESSION : null);
  const [profile, setProfile] = useState<Profile | null>(isLocalMode ? LOCAL_PROFILE : null);
  const [loading, setLoading] = useState(!isLocalMode);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // In local mode, everything is already set — skip Supabase auth
    if (isLocalMode) {
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isLocalMode) {
      setUser(LOCAL_USER);
      setSession(LOCAL_SESSION);
      setProfile(LOCAL_PROFILE);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        await logSecurityEvent('auth_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        await logSecurityEvent('auth_success', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString(),
          security_level: 'INFO'
        });
      }

      return { error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logSecurityEvent('auth_error', 'auth_attempts', {
        email,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        security_level: 'CRITICAL'
      });
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (isLocalMode) {
      return { error: null };
    }

    try {
      const redirectUrl = import.meta.env.VITE_APP_URL
        ? `${import.meta.env.VITE_APP_URL}/`
        : `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        await logSecurityEvent('signup_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        await logSecurityEvent('signup_success', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString()
        });

        if (fullName) {
          try {
            await sendAccountCreatedEmail(email, fullName, 'kontakt@leily.no');
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        }
      }

      return { error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logSecurityEvent('signup_error', 'auth_attempts', {
        email,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        security_level: 'CRITICAL'
      });
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const logSecurityEvent = async (action: string, table_name: string, details: Record<string, unknown>) => {
    if (isLocalMode) return;
    try {
      await supabase
        .from('audit_log')
        .insert({
          table_name,
          action,
          user_id: user?.id || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const signOut = async () => {
    if (isLocalMode) {
      // In local mode, just stay logged in
      return;
    }
    await supabase.auth.signOut();
  };

  const signInWithProvider = async (provider: 'google' | 'facebook') => {
    if (isLocalMode) {
      return { error: null };
    }
    const redirectUrl = import.meta.env.VITE_APP_URL
      ? `${import.meta.env.VITE_APP_URL}/`
      : `${window.location.origin}/`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    if (isLocalMode) {
      setProfile(prev => prev ? { ...prev, ...updates } as Profile : null);
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } as Profile : null);
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    if (isLocalMode) {
      return { error: null };
    }

    try {
      const redirectUrl = import.meta.env.VITE_APP_URL
        ? `${import.meta.env.VITE_APP_URL}/reset-password`
        : `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        await logSecurityEvent('password_reset_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        await logSecurityEvent('password_reset_requested', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString()
        });

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('email', email)
            .single();

          const fullName = profileData?.full_name || email.split('@')[0];
          await sendPasswordResetEmail(email, fullName, redirectUrl);
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
        }
      }

      return { error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logSecurityEvent('password_reset_error', 'auth_attempts', {
        email,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        security_level: 'CRITICAL'
      });
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    updateProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
