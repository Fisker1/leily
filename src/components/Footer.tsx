import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-muted/30 py-12 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-primary mb-4">PropertyCalc</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {t.companyDescription}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.copyright}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t.product}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t.calculatorNav}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.reports}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.portfolio}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.api}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t.support}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t.helpCenter}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.contact}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.privacy}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.terms}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;