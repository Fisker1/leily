import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAccountCreatedEmail, useEmailVerificationEmail, usePasswordResetEmail } from '@/hooks/useEmailService';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();
  const { sendAccountCreatedEmail } = useAccountCreatedEmail();
  const { sendEmailVerificationEmail } = useEmailVerificationEmail();
  const { sendPasswordResetEmail } = usePasswordResetEmail();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing profiles gracefully

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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state updates
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
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        
        // Log failed authentication attempt
        await logSecurityEvent('auth_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        // Log successful authentication
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
    try {
      // Environment-aware redirect URL
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
        // Log failed registration attempt
        await logSecurityEvent('signup_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        // Log successful registration
        await logSecurityEvent('signup_success', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString()
        });

        // Send welcome email if signup was successful
        if (fullName) {
          try {
            await sendAccountCreatedEmail(email, fullName, 'kontakt@leily.no');
            console.log('Welcome email sent successfully');
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the signup if email fails
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

  // Helper function to log security events
  const logSecurityEvent = async (action: string, table_name: string, details: Record<string, unknown>) => {
    try {
      await supabase
        .from('audit_log')
        .insert({
          table_name,
          action,
          user_id: user?.id || null,
          details: details as any
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithProvider = async (provider: 'google' | 'facebook') => {
    // Environment-aware redirect URL
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
    try {
      // Environment-aware redirect URL
      const redirectUrl = import.meta.env.VITE_APP_URL 
        ? `${import.meta.env.VITE_APP_URL}/reset-password`
        : `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Log failed password reset attempt
        await logSecurityEvent('password_reset_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        // Log successful password reset request
        await logSecurityEvent('password_reset_requested', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString()
        });

        // Send custom password reset email via Microsoft Exchange
        try {
          // Get user profile to get full name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('email', email)
            .single();

          const fullName = profileData?.full_name || email.split('@')[0];
          
          await sendPasswordResetEmail(email, fullName, redirectUrl);
          console.log('Password reset email sent successfully');
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
          // Don't fail the reset if email fails - Supabase will still send its own email
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