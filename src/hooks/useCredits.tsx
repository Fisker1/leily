import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useCredits = () => {
  const { user, profile } = useAuth();
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

  const hasCredits = () => credits > 0;

  const canGenerateReport = () => hasCredits();

  const useCredit = () => {
    if (credits > 0) {
      setCredits(prev => prev - 1);
      // TODO: Update credits in database
    }
  };

  return {
    credits,
    loading,
    hasCredits: hasCredits(),
    canGenerateReport: canGenerateReport(),
    useCredit
  };
};