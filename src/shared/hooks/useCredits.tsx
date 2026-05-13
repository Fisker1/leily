import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';
import { supabase } from '@/shared/integrations/supabase/client';

export const useCredits = () => {
  const { user, profile } = useAuth();
  const { isAdmin, isAmbassador } = useUserRole();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchCredits();

    // Set up realtime subscription for credit updates
    if (!user?.id) return;

    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Credits updated:', payload);
          if (payload.new && 'credits' in payload.new) {
            setCredits(payload.new.credits || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
    refreshCredits: fetchCredits,
    isAmbassador: isAmbassador || isAdmin // Show ambassador status
  };
};