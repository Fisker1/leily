import { cn } from "@/lib/utils";

interface LeilyLogoProps {
  className?: string;
  showText?: boolean;
}

const LeilyLogo = ({ className, showText = true }: LeilyLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Triangular Logo Icon */}
      <div className="relative">
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 100 100" 
          className="w-8 h-8"
        >
          {/* Main triangular shape with gradient */}
          <defs>
            <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e90ff" />
              <stop offset="50%" stopColor="#0066cc" />
              <stop offset="100%" stopColor="#00cc66" />
            </linearGradient>
          </defs>
          
          {/* Left triangle - blue */}
          <path
            d="M 15 20 L 50 20 L 32.5 80 Z"
            fill="url(#triangleGradient)"
          />
          
          {/* Right triangle - teal/green */}
          <path
            d="M 50 20 L 85 20 L 67.5 80 Z"
            fill="#00cc66"
          />
          
          {/* Center triangle - lighter */}
          <path
            d="M 32.5 80 L 67.5 80 L 50 40 Z"
            fill="#66ff99"
          />
        </svg>
      </div>
      
      {/* Leily Text */}
      {showText && (
        <span className="text-2xl font-bold text-foreground tracking-tight">
          Leily
        </span>
      )}
    </div>
  );
};

export default LeilyLogo;