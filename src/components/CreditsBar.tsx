import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Infinity } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { useUserRole } from '@/hooks/useUserRole';

interface CreditsBarProps {
  maxCredits?: number;
  className?: string;
}

const CreditsBar = ({ maxCredits = 100, className = "" }: CreditsBarProps) => {
  const { credits } = useCredits();
  const { isAmbassador } = useUserRole();
  
  const displayCredits = isAmbassador ? maxCredits : credits;
  const creditsPercentage = isAmbassador ? 100 : Math.min((credits / maxCredits) * 100, 100);
  
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
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 h-8 bg-background border rounded-lg shadow-sm min-w-[320px]">
            <div className="relative w-32 h-2.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${creditsPercentage}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-base font-bold tabular-nums ${getTextColor()}`}>
                {credits}
              </span>
              <span className="text-xs text-muted-foreground">
                credits
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsBar;