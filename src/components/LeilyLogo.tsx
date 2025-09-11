import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src="/lovable-uploads/452657a5-1a73-45d6-9cea-509d4b5a1e53.png" 
        alt="Leily Logo" 
        className="h-8 w-auto"
      />
      {showText && (
        <span className="text-2xl font-bold text-foreground">
          Leily
        </span>
      )}
    </div>
  );
};

export default LeilyLogo;