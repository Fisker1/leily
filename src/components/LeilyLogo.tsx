import { cn } from "@/lib/utils";
import leilyLogo from "@/assets/leily-logo-full.png";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={leilyLogo} 
        alt="Leily Logo" 
        className="h-10 w-auto"
      />
    </div>
  );
};

export default LeilyLogo;