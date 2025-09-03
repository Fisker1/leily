import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src="/lovable-uploads/a33c9203-ed4b-4b18-8d47-72ff2ef18f72.png" 
        alt="Leily Logo" 
        className="h-10 w-auto"
      />
    </div>
  );
};

export default LeilyLogo;