import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  level: 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  actionRequired?: string;
}

export const useEnhancedSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Enhanced rate limiting with progressive penalties
  const checkEnhancedRateLimit = useCallback(async (
    endpoint: string, 
    identifier: string, 
    maxRequests: number = 10,
    windowMinutes: number = 60
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('enhanced_rate_limit_check', {
        endpoint_name: endpoint,
        identifier_key: identifier,
        max_requests: maxRequests,
        window_minutes: windowMinutes
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow on error to not block legitimate users
      }

      if (!(data as any)?.allowed) {
        const violationLevel = (data as any)?.violation_level || 0;
        const resetTime = (data as any)?.reset_time ? new Date((data as any).reset_time) : new Date();
        
        toast({
          title: 'Rate limit exceeded',
          description: `Too many requests. ${
            violationLevel > 1 
              ? `Progressive penalty applied. Reset at ${resetTime.toLocaleTimeString()}` 
              : `Try again later.`
          }`,
          variant: 'destructive',
        });
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Enhanced rate limit error:', error);
      return true; // Allow on error
    }
  }, [toast]);

  // Monitor failed authentication attempts
  const monitorAuthFailures = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('track_failed_auth_attempts');
    } catch (error) {
      console.error('Auth monitoring error:', error);
    }
  }, [user]);

  // Password strength validation with server-side checks
  const validatePasswordStrength = useCallback(async (password: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_password_strength', {
        password_text: password
      });

      if (error) {
        console.error('Password validation error:', error);
        return {
          score: 0,
          strength: 'SVAKT',
          issues: ['Error validating password'],
          is_strong: false
        };
      }

      return data as any;
    } catch (error) {
      console.error('Password validation error:', error);
      return {
        score: 0,
        strength: 'SVAKT',
        issues: ['Error validating password'],
        is_strong: false
      };
    }
  }, []);

  // Input sanitization for security
  const sanitizeInput = useCallback((input: string, type: 'text' | 'email' | 'phone' | 'url' = 'text'): string => {
    if (!input) return '';

    let sanitized = input.trim();

    switch (type) {
      case 'email':
        // Basic email sanitization
        sanitized = sanitized.toLowerCase().replace(/[^\\w@.-]/g, '');
        break;
      case 'phone':
        // Keep only numbers, spaces, +, -, (, )
        sanitized = sanitized.replace(/[^\\d\\s+()-]/g, '');
        break;
      case 'url':
        // Basic URL sanitization
        sanitized = encodeURI(sanitized);
        break;
      case 'text':
      default:
        // Remove potentially dangerous characters
        sanitized = sanitized.replace(/[<>'\\"]/g, '');
        break;
    }

    return sanitized;
  }, []);

  // Log security events with enhanced context
  const logSecurityEvent = useCallback(async (
    action: string,
    tableName: string,
    details: any,
    level: 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'INFO'
  ) => {
    try {
      await supabase
        .from('audit_log')
        .insert({
          table_name: tableName,
          action,
          user_id: user?.id || null,
          details: {
            ...details,
            security_level: level,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            enhanced_monitoring: true
          }
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  // Automated security cleanup
  const runSecurityMaintenance = useCallback(async () => {
    try {
      await supabase.rpc('enhanced_security_cleanup');
    } catch (error) {
      console.error('Security maintenance error:', error);
    }
  }, []);

  // Monitor for suspicious patterns
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      monitorAuthFailures();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user, monitorAuthFailures]);

  // Run maintenance once per day
  useEffect(() => {
    const maintenanceInterval = setInterval(() => {
      runSecurityMaintenance();
    }, 24 * 60 * 60 * 1000); // Once per day

    // Run immediately on first load
    runSecurityMaintenance();

    return () => clearInterval(maintenanceInterval);
  }, [runSecurityMaintenance]);

  return {
    checkEnhancedRateLimit,
    validatePasswordStrength,
    sanitizeInput,
    logSecurityEvent,
    monitorAuthFailures,
    runSecurityMaintenance
  };
};
