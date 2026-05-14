import { useState, useEffect } from 'react';
import { supabase } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const isLocalMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(isLocalMode);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [loading, setLoading] = useState(!isLocalMode);

  useEffect(() => {
    // In local mode, user is always admin
    if (isLocalMode) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsAmbassador(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'ambassador']);

        if (error) throw error;

        const roles = data?.map(r => r.role) || [];
        setIsAdmin(roles.includes('admin'));
        setIsAmbassador(roles.includes('ambassador'));

      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsAmbassador(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  return { isAdmin, isAmbassador, loading };
};
