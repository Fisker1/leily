import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export const useSubscription = () => {
  const { profile } = useAuth();
  const { isAdmin, isAmbassador } = useUserRole();

  const hasRentalSubscription = () => {
    if (!profile) return false;
    if (isAdmin || isAmbassador) return true;
    return profile.subscription_tier === 'rental' || profile.subscription_tier === 'rental_active';
  };

  const isFree = () => {
    if (!profile) return true;
    if (isAdmin || isAmbassador) return false;
    return profile.subscription_tier === 'free';
  };

  // Credits not in staging DB
  const hasCredits = () => {
    if (isAdmin || isAmbassador) return true;
    return false;
  };

  // For backwards compatibility - isPro now means has credits OR rental subscription
  const isPro = () => {
    if (isAdmin || isAmbassador) return true;
    return hasCredits() || hasRentalSubscription();
  };

  // Show effective subscription tier
  const getEffectiveSubscriptionTier = () => {
    if (isAdmin || isAmbassador) return 'admin';
    return profile?.subscription_tier || 'free';
  };

  const subscriptionTier = getEffectiveSubscriptionTier();
  const subscriptionEnd = profile?.subscription_end;

  return {
    hasRentalSubscription: hasRentalSubscription(),
    hasCredits: hasCredits(),
    isFree: isFree(),
    isPro: isPro(), // Backwards compatibility
    subscriptionTier,
    subscriptionEnd,
    hasActiveRentalSubscription: hasRentalSubscription() && (!subscriptionEnd || new Date(subscriptionEnd) > new Date()),
    hasActiveSubscription: isPro() && (!subscriptionEnd || new Date(subscriptionEnd) > new Date())
  };
};