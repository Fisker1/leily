import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export const useSecureSubscriptionAdmin = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUserSubscription = async (
    targetUserId: string,
    subscriptionTier: 'free' | 'premium' | 'pro',
    subscriptionEnd: string | null,
    justification: string
  ) => {
    if (!user || !isAdmin) {
      toast.error('Admin privileges required');
      return { success: false, error: 'Unauthorized' };
    }

    if (!justification || justification.trim().length < 10) {
      toast.error('Justification required (minimum 10 characters)');
      return { success: false, error: 'Invalid justification' };
    }

    setIsUpdating(true);
    
    try {
      // Use the secure admin function instead of direct profile update
      const { data, error } = await supabase.rpc('admin_update_subscription', {
        target_user_id: targetUserId,
        new_subscription_tier: subscriptionTier,
        new_subscription_end: subscriptionEnd ? new Date(subscriptionEnd).toISOString() : null,
        admin_justification: justification
      });

      if (error) {
        console.error('Subscription update error:', error);
        toast.error(`Failed to update subscription: ${error.message}`);
        return { success: false, error: error.message };
      }

      toast.success('Subscription updated successfully with security logging');
      return { success: true, data };
    } catch (error) {
      console.error('Subscription update error:', error);
      toast.error('Failed to update subscription');
      return { success: false, error: 'Unknown error' };
    } finally {
      setIsUpdating(false);
    }
  };

  const promoteToAmbassador = async (targetUserId: string, justification: string) => {
    if (!user || !isAdmin) {
      toast.error('Admin privileges required');
      return { success: false, error: 'Unauthorized' };
    }

    setIsUpdating(true);
    
    try {
      // First promote to ambassador role
      const { error: roleError } = await supabase.rpc('promote_user_to_ambassador', {
        target_user_id: targetUserId
      });

      if (roleError) {
        console.error('Role promotion error:', roleError);
        toast.error(`Failed to promote user: ${roleError.message}`);
        return { success: false, error: roleError.message };
      }

      // Then use secure function to update subscription
      const subscriptionResult = await updateUserSubscription(
        targetUserId, 
        'premium', 
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        `Ambassador promotion: ${justification}`
      );

      if (subscriptionResult.success) {
        toast.success('User promoted to ambassador with premium subscription');
      }

      return subscriptionResult;
    } catch (error) {
      console.error('Ambassador promotion error:', error);
      toast.error('Failed to promote user to ambassador');
      return { success: false, error: 'Unknown error' };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateUserSubscription,
    promoteToAmbassador,
    isUpdating,
    isAuthorized: isAdmin
  };
};