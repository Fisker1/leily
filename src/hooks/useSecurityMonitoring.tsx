import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  action: string;
  table_name: string;
  details?: any;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    if (!user) return;

    try {
      await supabase
        .from('audit_log')
        .insert({
          table_name: event.table_name,
          action: event.action,
          user_id: user.id,
          details: event.details || {}
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  const logAuthAttempt = useCallback((success: boolean, method: string) => {
    logSecurityEvent({
      action: success ? 'auth_success' : 'auth_failure',
      table_name: 'auth_attempts',
      details: {
        method,
        timestamp: new Date().toISOString(),
        ip: 'unknown', // Would need server-side tracking for real IP
        user_agent: navigator.userAgent
      }
    });
  }, [logSecurityEvent]);

  const logSensitiveDataAccess = useCallback((tableName: string, operation: string) => {
    logSecurityEvent({
      action: 'sensitive_data_access',
      table_name: tableName,
      details: {
        operation,
        timestamp: new Date().toISOString()
      }
    });
  }, [logSecurityEvent]);

  const logAdminAction = useCallback((action: string, details?: any) => {
    logSecurityEvent({
      action: `admin_${action}`,
      table_name: 'admin_actions',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }, [logSecurityEvent]);

  // Monitor for suspicious activity patterns
  useEffect(() => {
    if (!user) return;

    const monitorSuspiciousActivity = async () => {
      try {
        // Check for rapid failed login attempts (would need more sophisticated tracking)
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        const { data: recentFailures } = await supabase
          .from('audit_log')
          .select('*')
          .eq('action', 'auth_failure')
          .eq('user_id', user.id)
          .gte('created_at', fiveMinutesAgo.toISOString());

        if (recentFailures && recentFailures.length > 5) {
          logSecurityEvent({
            action: 'suspicious_activity_detected',
            table_name: 'security_alerts',
            details: {
              type: 'rapid_failed_logins',
              count: recentFailures.length,
              timeframe: '5_minutes'
            }
          });
        }
      } catch (error) {
        console.error('Error monitoring suspicious activity:', error);
      }
    };

    // Run monitoring every 5 minutes
    const interval = setInterval(monitorSuspiciousActivity, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, logSecurityEvent]);

  return {
    logSecurityEvent,
    logAuthAttempt,
    logSensitiveDataAccess,
    logAdminAction
  };
};