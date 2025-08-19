import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Download, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const CallToAction = () => {
  const { translations } = useLanguage();
  
  return (
    <section className="py-20 lg:py-32 bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 lg:p-12 shadow-large border-0 bg-card-elevated">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {translations.cta.title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {translations.cta.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-medium" asChild>
                <Link to="/auth">
                  <Calculator className="mr-2 h-5 w-5" />
                  {translations.cta.button}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="shadow-soft">
                <Download className="mr-2 h-5 w-5" />
                Last ned eksempel rapport
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Ikke behov for kredittkort
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Øyeblikkelige beregninger
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Profesjonelle PDF rapporter
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;