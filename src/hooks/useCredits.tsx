import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';
import { supabase } from '@/integrations/supabase/client';

export const useCredits = () => {
  const { user, profile } = useAuth();
  const { isAdmin, isAmbassador } = useUserRole();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setCredits(0);
        setLoading(false);
        return;
      }

      try {
        // Get credits from profile (now properly typed)
        const userCredits = profile?.credits || 0;
        setCredits(userCredits);
      } catch (error) {
        console.error('Error fetching credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user, profile]);

  const hasCredits = () => {
    if (!profile) return false;
    if (isAdmin || isAmbassador) return true; // Ambassadors and admins get free access
    const credits = profile?.credits || 0;
    return credits > 0;
  };

  const canUseCredits = () => {
    // Admins and ambassadors always have access
    if (isAdmin || isAmbassador) return true;
    return hasCredits();
  };

  const useCredit = async () => {
    // Admins and ambassadors don't use actual credits
    if (isAdmin || isAmbassador) return true;
    
    if (credits > 0) {
      try {
        // Use the Supabase function to properly deduct credits
        const { data, error } = await supabase.rpc('use_credits', {
          credits_to_use: 1,
          operation_type: 'ai_interaction'
        });
        
        if (error) {
          console.error('Error using credits:', error);
          return false;
        }
        
        if (data) {
          setCredits(prev => prev - 1);
          return true;
        }
      } catch (error) {
        console.error('Error calling use_credits function:', error);
      }
    }
    return false;
  };

  return {
    credits,
    loading,
    hasCredits: hasCredits(),
    canUseCredits: canUseCredits(),
    canGenerateReport: canUseCredits(),
    useCredit,
    isAmbassador: isAmbassador || isAdmin // Show ambassador status
  };
};