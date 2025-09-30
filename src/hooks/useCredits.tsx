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
      if (!user?.id) {
        setCredits(0);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setCredits(profile?.credits || 0);
      } catch (error) {
        console.error('Error fetching credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  const hasCredits = () => {
    if (isAdmin || isAmbassador) return true;
    return credits > 0;
  };

  const canUseCredits = () => {
    // Admins and ambassadors always have access
    if (isAdmin || isAmbassador) return true;
    return hasCredits();
  };

  const useCredit = async () => {
    if (!user?.id) return false;
    if (isAdmin || isAmbassador) return true;

    try {
      const newCredits = Math.max(0, credits - 1);
      
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) throw error;

      setCredits(newCredits);
      return true;
    } catch (error) {
      console.error('Error using credit:', error);
      return false;
    }
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