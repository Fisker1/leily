import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/lovable-uploads/8547b8fd-be08-45e8-bf77-cd8d2c6b5601.png" 
        alt="Leily Logo" 
        className="h-16 w-16"
      />
      {showText && (
        <span className="text-2xl font-bold text-foreground tracking-tight">
          Leily
        </span>
      )}
    </div>
  );
};

export default LeilyLogo;