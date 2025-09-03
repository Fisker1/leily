import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src="/lovable-uploads/7fdc8aa1-0826-4dec-9e36-0027dae5dbfe.png" 
        alt="Leily Logo" 
        className="h-10 w-auto"
      />
    </div>
  );
};

export default LeilyLogo;