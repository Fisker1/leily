import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileText, 
  MessageCircle, 
  Eye, 
  Edit, 
  EyeOff, 
  Trash,
  PartyPopper
} from 'lucide-react';

interface Property {
  id: string;
  show_in_rental?: boolean;
  lease_agreements?: Array<{
    id: string;
    tenant_id: string;
    monthly_rent: number;
    status: string;
    start_date: string;
    end_date: string;
    tenants?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }>;
}

interface PropertyActionsBalloonProps {
  property: Property;
  onDocuments: () => void;
  onTenantChat: () => void;
  onDetails: () => void;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onMouseLeave?: () => void;
}

export const PropertyActionsBalloon: React.FC<PropertyActionsBalloonProps> = ({
  property,
  onDocuments,
  onTenantChat,
  onDetails,
  onEdit,
  onToggleVisibility,
  onDelete,
  onMouseLeave,
}) => {
  const [isPopped, setIsPopped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleBalloonClick = () => {
    if (isPopped || isAnimating) return;
    
    setIsAnimating(true);
    
    // Pop animation
    setTimeout(() => {
      setIsPopped(true);
      setIsAnimating(false);
    }, 300);
  };

  const handleReset = () => {
    setIsPopped(false);
    setIsAnimating(false);
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  if (!isPopped) {
    return (
      <div className="flex justify-center items-center h-32">
        <div
          className={`cursor-pointer transition-all duration-300 ${
            isAnimating 
              ? 'animate-ping scale-150 opacity-0' 
              : 'hover:scale-110 hover:-translate-y-2 hover:rotate-12'
          }`}
          onClick={handleBalloonClick}
        >
          <PartyPopper 
            className={`h-12 w-12 text-primary transition-all duration-200 ${
              isAnimating ? 'scale-0' : ''
            }`} 
          />
        </div>
        {!isAnimating && (
          <div className="absolute mt-16 text-xs text-muted-foreground opacity-75">
            Klikk ballongen
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <TooltipProvider>
        <div className="space-y-2">
          {/* Reset button */}
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleReset}
            >
              ×
            </Button>
          </div>

          {/* First row: Dokumenter and Leiechat (if rented) */}
          <div className={`grid gap-2 ${property.lease_agreements?.[0] ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-10 px-2 text-xs"
                  onClick={onDocuments}
                >
                  <FileText className="h-4 w-4" />
                  <span className="ml-1">Dokumenter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dokumenter</p>
              </TooltipContent>
            </Tooltip>
            
            {property.lease_agreements?.[0] && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-10 px-2 text-xs bg-primary/5 hover:bg-primary/10 border-primary/20"
                    onClick={onTenantChat}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="ml-1">Leiechat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat med leietaker</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
         
         {/* Second row: Detaljer and Rediger */}
         <div className="grid grid-cols-2 gap-2">
           <Tooltip>
             <TooltipTrigger asChild>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full h-10 px-2 text-xs"
                 onClick={onDetails}
               >
                 <Eye className="h-4 w-4" />
                 <span className="ml-1">Detaljer</span>
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               <p>Detaljer</p>
             </TooltipContent>
           </Tooltip>
           
           <Tooltip>
             <TooltipTrigger asChild>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full h-10 px-2 text-xs"
                 onClick={onEdit}
               >
                 <Edit className="h-4 w-4" />
                 <span className="ml-1">Rediger</span>
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               <p>Rediger</p>
             </TooltipContent>
           </Tooltip>
         </div>
         
         {/* Third row: Skjul and Slett */}
         <div className="grid grid-cols-2 gap-2">
           <Tooltip>
             <TooltipTrigger asChild>
               <Button 
                 variant={property.show_in_rental !== false ? "outline" : "default"} 
                 size="sm" 
                 className="w-full h-10 px-2 text-xs"
                 onClick={onToggleVisibility}
               >
                 {property.show_in_rental !== false ? (
                   <EyeOff className="h-4 w-4" />
                 ) : (
                   <Eye className="h-4 w-4" />
                 )}
                 <span className="ml-1">
                   {property.show_in_rental !== false ? "Skjul" : "Vis"}
                 </span>
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               <p>{property.show_in_rental !== false ? "Skjul fra utleie" : "Vis på utleie"}</p>
             </TooltipContent>
           </Tooltip>
         
           <Tooltip>
             <TooltipTrigger asChild>
               <Button 
                 variant="destructive" 
                 size="sm" 
                 className="w-full h-10 px-2 text-xs hover:bg-red-600 dark:hover:bg-red-500"
                 onClick={onDelete}
               >
                 <Trash className="h-4 w-4" />
                 <span className="ml-1">Slett</span>
               </Button>
             </TooltipTrigger>
             <TooltipContent>
               <p>Slett</p>
             </TooltipContent>
           </Tooltip>
         </div>
       </div>
     </TooltipProvider>
   </div>
  );
};