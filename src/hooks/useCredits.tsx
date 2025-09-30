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
    // Credits not in staging DB - admins/ambassadors get unlimited
    if (isAdmin || isAmbassador) {
      setCredits(999);
    } else {
      setCredits(0);
    }
    setLoading(false);
  }, [user, isAdmin, isAmbassador]);

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
    // Credits system not in staging - admins/ambassadors always succeed
    if (isAdmin || isAmbassador) return true;
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