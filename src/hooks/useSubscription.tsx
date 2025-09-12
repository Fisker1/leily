import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export const useSubscription = () => {
  const { profile } = useAuth();
  const { isAdmin, isAmbassador } = useUserRole();

  const isPro = () => {
    if (!profile) return false;
    // Admin users and ambassadors automatically get Pro access
    if (isAdmin || isAmbassador) return true;
    return profile.subscription_tier === 'premium' || profile.subscription_tier === 'pro';
  };

  const isFree = () => {
    if (!profile) return true;
    // Admins and ambassadors are never considered "free" users
    if (isAdmin || isAmbassador) return false;
    return profile.subscription_tier === 'free';
  };

  // Show effective subscription tier (Pro for admins/ambassadors)
  const getEffectiveSubscriptionTier = () => {
    if (isAdmin || isAmbassador) return 'pro';
    return profile?.subscription_tier || 'free';
  };

  const subscriptionTier = getEffectiveSubscriptionTier();
  const subscriptionEnd = profile?.subscription_end;

  return {
    isPro: isPro(),
    isFree: isFree(),
    subscriptionTier,
    subscriptionEnd,
    hasActiveSubscription: isPro() && (!subscriptionEnd || new Date(subscriptionEnd) > new Date())
  };
};