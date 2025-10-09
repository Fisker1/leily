import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import FeedbackDialog from "@/components/FeedbackDialog";

const Footer = () => {
  const { translations } = useLanguage();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      
      <footer className="bg-muted/30 py-12 border-t border-border relative mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-primary mb-4">{translations.footer.company}</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {translations.footer.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {translations.footer.copyright}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produkt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/calculator" className="hover:text-primary transition-colors">Investeringskalkulator</a></li>
              <li><a href="/portfolio" className="hover:text-primary transition-colors">Portfolio</a></li>
              <li><a href="/rental" className="hover:text-primary transition-colors">Utleie</a></li>
              <li><a href="/#pricing" className="hover:text-primary transition-colors">Priser</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => setFeedbackOpen(true)}
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <MessageCircle className="h-4 w-4 animate-pulse group-hover:animate-bounce" />
                  Tilbakemelding
                </button>
              </li>
              <li><a href="#" className="hover:text-primary transition-colors">Hjelpesenter</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{translations.footer.links.contact}</a></li>
              <li><a href="/privacy" className="hover:text-primary transition-colors">{translations.footer.links.privacy}</a></li>
              <li><a href="/terms" className="hover:text-primary transition-colors">{translations.footer.links.terms}</a></li>
              <li><a href="/cookies" className="hover:text-primary transition-colors">Cookie-policy</a></li>
            </ul>
          </div>
        </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;