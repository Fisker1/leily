import { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableSplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number; // percentage
}

export const ResizableSplitView = ({ 
  left, 
  right, 
  defaultLeftWidth = 40 
}: ResizableSplitViewProps) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 25% and 75%
      if (newLeftWidth >= 25 && newLeftWidth <= 75) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex h-full relative select-none">
      {/* Left Panel */}
      <div 
        style={{ width: `${leftWidth}%` }}
        className="h-full"
      >
        {left}
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className={`
          w-2 bg-gradient-to-b from-transparent via-border/30 to-transparent 
          hover:via-primary/30 cursor-col-resize transition-colors duration-200 
          relative group rounded-full mx-1
          ${isDragging ? 'via-primary' : ''}
        `}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      bg-background border border-border rounded-full p-1 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      shadow-md pointer-events-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Right Panel */}
      <div 
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full"
      >
        {right}
      </div>
    </div>
  );
};
