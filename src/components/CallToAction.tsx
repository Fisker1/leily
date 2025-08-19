import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Download, Calculator } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CallToAction = () => {
  const { t } = useLanguage();
  
  return (
    <section className="py-20 lg:py-32 bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 lg:p-12 shadow-large border-0 bg-card-elevated">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {t.ctaTitle}
              <span className="text-primary block">{t.ctaTitleHighlight}</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.ctaDescription}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-medium">
                <Calculator className="mr-2 h-5 w-5" />
                {t.startFreeAnalysis}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="shadow-soft">
                <Download className="mr-2 h-5 w-5" />
                {t.downloadSampleReport}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                {t.noCreditCard}
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                {t.instantCalculations}
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                {t.professionalReports}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;