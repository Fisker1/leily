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
  
  // Credits not in staging DB - show infinity for ambassadors, 0 for others
  const displayCredits = isAmbassador ? maxCredits : 0;
  const creditsPercentage = isAmbassador ? 100 : 0;
  
  // Color logic based on credit level - more subtle colors
  const getProgressColor = () => {
    if (isAmbassador) return "bg-gradient-to-r from-amber-400 to-yellow-500";
    if (creditsPercentage >= 70) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (creditsPercentage >= 30) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    return "bg-gradient-to-r from-slate-500 to-gray-500";
  };

  const getTextColor = () => {
    if (isAmbassador) return "text-amber-600";
    if (creditsPercentage >= 70) return "text-green-600";
    if (creditsPercentage >= 30) return "text-blue-600";
    return "text-slate-600";
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-80 h-6 bg-muted/60 rounded-full overflow-hidden border border-border/50">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
              style={{ width: `${creditsPercentage}%` }}
            />
            {/* Subtle inner glow */}
            <div 
              className={`absolute inset-y-0 left-0 rounded-full opacity-30 blur-sm ${getProgressColor()}`}
              style={{ width: `${creditsPercentage}%` }}
            />
            {/* Credits text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-medium tabular-nums mix-blend-difference text-white`}>
                {displayCredits}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsBar;