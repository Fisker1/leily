import { useState } from "react";
import FeedbackDialog from "@/components/FeedbackDialog";

const MinimalFooter = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      
      <footer className="py-6 mt-16 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Leily</span>
            <button 
              onClick={() => setFeedbackOpen(true)}
              className="hover:text-foreground transition-colors hover:underline"
            >
              Tilbakemelding
            </button>
            <a href="/privacy" className="hover:text-foreground transition-colors hover:underline">
              Personvern
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors hover:underline">
              Vilkår
            </a>
            <a href="/cookies" className="hover:text-foreground transition-colors hover:underline">
              Cookies
            </a>
            <a href="/#pricing" className="hover:text-foreground transition-colors hover:underline">
              Priser
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default MinimalFooter;
