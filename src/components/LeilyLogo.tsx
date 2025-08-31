import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src="/lovable-uploads/bc6f9f14-566a-4a33-a44f-e7b3044e79ea.png" 
        alt="Leily Logo" 
        className="h-20 w-auto"
      />
    </div>
  );
};

export default LeilyLogo;