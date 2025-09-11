import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RateLimitResponse {
  success: boolean;
  remaining?: number;
  resetTime?: string;
  error?: string;
  retryAfter?: number;
}

export const useRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkRateLimit = async (endpoint: string, identifier?: string): Promise<boolean> => {
    setIsChecking(true);

    try {
      // Use IP address as fallback identifier
      const rateLimitIdentifier = identifier || await getClientIdentifier();
      
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          endpoint,
          identifier: rateLimitIdentifier
        }
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Allow request to proceed if rate limiter fails
        return true;
      }

      const response = data as RateLimitResponse;

      if (!response.success) {
        const retryAfterMinutes = Math.ceil((response.retryAfter || 300) / 60);
        toast.error(
          response.error || 'Rate limit exceeded',
          {
            description: `Please try again in ${retryAfterMinutes} minutes`,
            duration: 5000
          }
        );
        return false;
      }

      // Show warning when approaching limit
      if (response.remaining !== undefined && response.remaining <= 2) {
        toast.warning(
          `Rate limit warning: ${response.remaining} requests remaining`,
          {
            description: 'Please slow down your requests',
            duration: 3000
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow request to proceed if rate limiter fails
      return true;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkRateLimit,
    isChecking
  };
};

// Get a client identifier (simplified approach)
const getClientIdentifier = async (): Promise<string> => {
  // In a real implementation, you might want to use a more sophisticated approach
  // This is a simple fallback using browser fingerprinting
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Rate limit fingerprint', 2, 2);
  }
  
  const fingerprint = canvas.toDataURL();
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};