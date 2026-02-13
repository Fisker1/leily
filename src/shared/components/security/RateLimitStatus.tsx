import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RateLimitInfo {
  endpoint: string;
  remaining: number;
  maxRequests: number;
  resetTime: string;
  windowMinutes: number;
}

const RATE_LIMIT_CONFIGS = {
  'auth/login': { maxRequests: 5, windowMinutes: 15, label: 'Login attempts' },
  'auth/register': { maxRequests: 3, windowMinutes: 60, label: 'Registration attempts' },
  'tenant/access': { maxRequests: 10, windowMinutes: 5, label: 'Tenant data access' },
  'payment/create': { maxRequests: 3, windowMinutes: 15, label: 'Payment creation' }
};

export const RateLimitStatus: React.FC<{ className?: string }> = ({ className }) => {
  const { user } = useAuth();
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const checkRateLimit = async (endpoint: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          endpoint,
          identifier: user.id
        }
      });

      if (error) {
        console.warn('Rate limit check failed:', error);
        return null;
      }

      const config = RATE_LIMIT_CONFIGS[endpoint as keyof typeof RATE_LIMIT_CONFIGS];
      if (!config) return null;

      return {
        endpoint,
        remaining: data.remaining || config.maxRequests,
        maxRequests: config.maxRequests,
        resetTime: data.resetTime || new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString(),
        windowMinutes: config.windowMinutes
      };
    } catch (error) {
      console.warn('Rate limit check error:', error);
      return null;
    }
  };

  const refreshRateLimits = async () => {
    if (!user) return;
    
    setLoading(true);
    const limits: RateLimitInfo[] = [];
    
    for (const endpoint of Object.keys(RATE_LIMIT_CONFIGS)) {
      const limit = await checkRateLimit(endpoint);
      if (limit) {
        limits.push(limit);
      }
    }
    
    setRateLimits(limits);
    setLoading(false);
  };

  useEffect(() => {
    refreshRateLimits();
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshRateLimits, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatusColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!user) return null;

  const criticalLimits = rateLimits.filter(limit => limit.remaining <= 2);

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Rate Limit Status
          </CardTitle>
          <CardDescription>
            Security limits to protect against abuse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {criticalLimits.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You're approaching rate limits on {criticalLimits.length} endpoint(s). 
                Please slow down your requests.
              </AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-sm text-muted-foreground">Checking limits...</div>
          ) : rateLimits.length === 0 ? (
            <div className="text-sm text-muted-foreground">All limits normal</div>
          ) : (
            <div className="space-y-2">
              {rateLimits.map((limit) => {
                const config = RATE_LIMIT_CONFIGS[limit.endpoint as keyof typeof RATE_LIMIT_CONFIGS];
                const percentage = (limit.remaining / limit.maxRequests) * 100;
                
                return (
                  <div key={limit.endpoint} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">{config.label}</span>
                      <span className={getStatusColor(limit.remaining, limit.maxRequests)}>
                        {limit.remaining}/{limit.maxRequests}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-1"
                    />
                    {limit.remaining <= 2 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Resets {new Date(limit.resetTime).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Protected
              </Badge>
              <button 
                onClick={refreshRateLimits}
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};