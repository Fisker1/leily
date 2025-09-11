import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src="/lovable-uploads/a307073e-e0ff-4a05-8b51-1239b1270ed3.png" 
        alt="Leily Logo" 
        className="h-10 w-auto"
      />
    </div>
  );
};

export default LeilyLogo;