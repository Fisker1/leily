import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export const useSubscription = () => {
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();

  const isPro = () => {
    if (!profile) return false;
    // Admin users automatically get Pro access
    if (isAdmin) return true;
    return profile.subscription_tier === 'premium' || profile.subscription_tier === 'pro';
  };

  const isFree = () => {
    if (!profile) return true;
    return profile.subscription_tier === 'free';
  };

  const subscriptionTier = profile?.subscription_tier || 'free';
  const subscriptionEnd = profile?.subscription_end;

  return {
    isPro: isPro(),
    isFree: isFree(),
    subscriptionTier,
    subscriptionEnd,
    hasActiveSubscription: isPro() && (!subscriptionEnd || new Date(subscriptionEnd) > new Date())
  };
};