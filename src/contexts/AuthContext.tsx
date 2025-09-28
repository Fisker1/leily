import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'facebook') => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
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
      // Enhanced rate limiting with progressive penalties
      const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc('enhanced_rate_limit_check', {
        endpoint_name: 'auth/login',
        identifier_key: email,
        max_requests: 5, // Stricter limit for login attempts
        window_minutes: 15
      });

      if (rateLimitError || !(rateLimitResult as any)?.allowed) {
        const violationLevel = (rateLimitResult as any)?.violation_level || 0;
        return { 
          error: { 
            message: violationLevel > 1 
              ? 'Multiple failed attempts detected. Extended cooldown applied.' 
              : 'Rate limit exceeded. Please try again later.' 
          } 
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if this is the staging test user and try to create it automatically
        const isStaging = window.location.host.includes('stage') || window.location.host.includes('localhost') || window.location.host.includes('vercel.app');
        const isTestUser = email === 'anderslundoy@protonmail.com' && password === 'blåmeis';
        
        if (isStaging && isTestUser && (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed'))) {
          try {
            console.log('🥷 Attempting to create staging test user automatically...');
            const createResponse = await supabase.functions.invoke('create-staging-user', {
              method: 'POST'
            });
            
            if (!createResponse.error) {
              console.log('🥷 Test user created, retrying login...');
              // Retry the login after user creation
              const { error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (!retryError) {
                // Success on retry, log it and return
                await logSecurityEvent('auth_success', 'auth_attempts', {
                  email,
                  timestamp: new Date().toISOString(),
                  security_level: 'INFO',
                  note: 'staging_test_user_auto_created'
                });
                return { error: null };
              } else {
                // Still failed after creation
                return { error: retryError };
              }
            }
          } catch (createError) {
            console.error('🥷 Failed to create staging user:', createError);
          }
        }
        
        // Log failed authentication attempt with enhanced context
        await logSecurityEvent('auth_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString(),
          security_level: 'HIGH',
          attempt_context: 'enhanced_monitoring'
        });
        
        // Trigger brute force monitoring
        await supabase.rpc('track_failed_auth_attempts');
      } else {
        // Log successful authentication
        await logSecurityEvent('auth_success', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString(),
          security_level: 'INFO'
        });
      }

      return { error };
    } catch (error: any) {
      await logSecurityEvent('auth_error', 'auth_attempts', {
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
        security_level: 'CRITICAL'
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // Enhanced rate limiting for registration
      const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc('enhanced_rate_limit_check', {
        endpoint_name: 'auth/register',
        identifier_key: email,
        max_requests: 3, // Stricter limit for registration
        window_minutes: 60
      });

      if (rateLimitError || !(rateLimitResult as any)?.allowed) {
        return { 
          error: { 
            message: 'Too many registration attempts. Please try again later.' 
          } 
        };
      }

      // Validate password strength before attempting registration
      const { data: passwordValidation } = await supabase.rpc('validate_password_strength', {
        password_text: password
      });

      if (!(passwordValidation as any)?.is_strong) {
        return {
          error: {
            message: 'Password does not meet security requirements. Please choose a stronger password.'
          }
        };
      }

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
        // Log failed registration attempt with enhanced context
        await logSecurityEvent('signup_failure', 'auth_attempts', {
          email,
          error: error.message,
          timestamp: new Date().toISOString(),
          security_level: 'HIGH',
          password_strength_check: 'performed'
        });
      } else {
        // Log successful registration
        await logSecurityEvent('signup_success', 'auth_attempts', {
          email,
          timestamp: new Date().toISOString(),
          security_level: 'INFO',
          password_strength_check: 'passed'
        });
      }

      return { error };
    } catch (error: any) {
      await logSecurityEvent('signup_error', 'auth_attempts', {
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
        security_level: 'CRITICAL'
      });
      return { error };
    }
  };

  // Helper function to log security events
  const logSecurityEvent = async (action: string, table_name: string, details: any) => {
    try {
      await supabase
        .from('audit_log')
        .insert({
          table_name,
          action,
          user_id: user?.id || null,
          details
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};