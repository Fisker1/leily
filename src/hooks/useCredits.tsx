import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

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
        // For now, we'll check if there's a credits field in profile
        // This would normally be fetched from a separate credits table
        const userCredits = (profile as any)?.credits || 0;
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
    const credits = (profile as any)?.credits || 0;
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
      setCredits(prev => prev - 1);
      // TODO: Update credits in database via API call
      return true;
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