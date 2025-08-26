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
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e7fd4" />
              <stop offset="100%" stopColor="#0d4f8c" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* Left side of "A" - blue */}
          <path
            d="M 20 85 L 50 15 L 35 85 Z"
            fill="url(#blueGradient)"
          />
          
          {/* Right side of "A" - green */}
          <path
            d="M 50 15 L 80 85 L 65 85 Z"
            fill="url(#greenGradient)"
          />
          
          {/* Bottom triangle fill - green */}
          <path
            d="M 35 85 L 65 85 L 50 60 Z"
            fill="url(#greenGradient)"
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