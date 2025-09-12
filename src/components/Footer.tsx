import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { translations } = useLanguage();
  
  return (
    <footer className="bg-muted/30 py-12 border-t border-border">
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
              <li><a href="/pricing" className="hover:text-primary transition-colors">Priser</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Hjelpesenter</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{translations.footer.links.contact}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{translations.footer.links.privacy}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{translations.footer.links.terms}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;