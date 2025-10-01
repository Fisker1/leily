import { Badge } from "@/components/ui/badge";
import { Shield, Star } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

interface UserRoleBadgeProps {
  className?: string;
}

export const UserRoleBadge = ({ className = "" }: UserRoleBadgeProps) => {
  const { isAdmin, isAmbassador } = useUserRole();
  const { profile } = useAuth();

  // Priority: Admin > Ambassadør > Pro > Gratis
  if (isAdmin) {
    return (
      <Badge variant="secondary" className={`h-7 px-3 text-sm ${className}`}>
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  }

  if (isAmbassador) {
    return (
      <Badge variant="outline" className={`h-7 px-3 text-sm border-amber-300 text-amber-700 bg-amber-50 ${className}`}>
        <Star className="w-3 h-3 mr-1 fill-current" />
        Ambassadør
      </Badge>
    );
  }

  if (profile?.subscription_tier === 'pro') {
    return (
      <Badge variant="default" className={`h-7 px-3 text-sm ${className}`}>
        Pro
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`h-7 px-3 text-sm ${className}`}>
      Gratis
    </Badge>
  );
};

export const getUserRoleText = (isAdmin: boolean, isAmbassador: boolean, subscriptionTier?: string): string => {
  if (isAdmin) return "Admin";
  if (isAmbassador) return "Ambassadør";
  if (subscriptionTier === 'pro') return "Pro";
  return "Gratis";
};
