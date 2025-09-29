import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Infinity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface CreditsBarProps {
  credits?: number;
  maxCredits?: number;
  className?: string;
}

const CreditsBar = ({ credits = 0, maxCredits = 100, className = "" }: CreditsBarProps) => {
  const { profile } = useAuth();
  const { isAmbassador } = useUserRole();
  
  // Ambassador users always have "full" credits
  const displayCredits = isAmbassador ? maxCredits : (profile?.credits || 0);
  const creditsPercentage = isAmbassador ? 100 : Math.min((displayCredits / maxCredits) * 100, 100);
  
  // Color logic based on credit level
  const getProgressColor = () => {
    if (isAmbassador) return "bg-gradient-to-r from-amber-400 to-yellow-500";
    if (creditsPercentage >= 70) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (creditsPercentage >= 30) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    return "bg-gradient-to-r from-red-500 to-pink-500";
  };

  const getTextColor = () => {
    if (isAmbassador) return "text-amber-600";
    if (creditsPercentage >= 70) return "text-green-600";
    if (creditsPercentage >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isAmbassador ? (
        <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
          <Star className="w-3 h-3 mr-1 fill-current" />
          <Infinity className="w-3 h-3" />
          Credits
        </Badge>
      ) : (
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-60 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
              style={{ width: `${creditsPercentage}%` }}
            />
            {/* Subtle glow effect */}
            <div 
              className={`absolute inset-y-0 left-0 rounded-full opacity-50 blur-sm ${getProgressColor()}`}
              style={{ width: `${creditsPercentage}%` }}
            />
          </div>
          <span className={`text-xs font-medium tabular-nums ${getTextColor()}`}>
            {displayCredits}
          </span>
        </div>
      )}
    </div>
  );
};

export default CreditsBar;