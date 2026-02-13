import React from 'react';
import { cn } from '@/shared/lib/utils';

interface GaugeProps {
  className?: string;
  animated?: boolean;
}

const Gauge: React.FC<GaugeProps> = ({ className, animated = false }) => {
  return (
    <div className={cn("relative w-4 h-4 flex items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        {/* Gauge background arc */}
        <path
          d="M4 12a8 8 0 0 1 16 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
        {/* Gauge active arc */}
        <path
          d="M6 14a6 6 0 0 1 12 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Gauge needle */}
        <line
          x1="12"
          y1="12"
          x2="12"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={animated ? "animate-gauge-needle" : ""}
          style={{ transformOrigin: '12px 12px' }}
        />
        {/* Center dot */}
        <circle
          cx="12"
          cy="12"
          r="1"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default Gauge;