import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, TrendingUp, FileText, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import ProcessWalkthrough from "@/components/ProcessWalkthrough";

const Hero = () => {
  const { translations } = useLanguage();
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  
  return (
    <section className="relative bg-gradient-hero py-20 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {translations.hero.title}
            </h1>
            <p className="mt-4 lg:mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {translations.hero.subtitle}
            </p>
            
            <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-medium" asChild>
                <Link to="/calculator">
                  <Calculator className="mr-2 h-5 w-5" />
                  {translations.hero.cta}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="shadow-soft"
                onClick={() => setIsWalkthroughOpen(true)}
              >
                {translations.hero.secondaryCta}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 lg:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              <Card className="p-3 lg:p-4 text-center shadow-soft">
                <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1.5 lg:mb-2" />
                <p className="text-xs lg:text-sm text-muted-foreground">{translations.features.feature1.title}</p>
              </Card>
              <Card className="p-3 lg:p-4 text-center shadow-soft">
                <PieChart className="h-5 w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1.5 lg:mb-2" />
                <p className="text-xs lg:text-sm text-muted-foreground">{translations.features.feature2.title}</p>
              </Card>
              <Card className="p-3 lg:p-4 text-center shadow-soft">
                <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1.5 lg:mb-2" />
                <p className="text-xs lg:text-sm text-muted-foreground">{translations.features.feature3.title}</p>
              </Card>
              <Card className="p-3 lg:p-4 text-center shadow-soft">
                <Calculator className="h-5 w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1.5 lg:mb-2" />
                <p className="text-xs lg:text-sm text-muted-foreground">{translations.calculator.title}</p>
              </Card>
            </div>
          </div>

          {/* Image */}
          <div className="relative lg:mt-0 mt-8">
            <Card className="overflow-hidden shadow-large">
              <img 
                src={heroImage} 
                alt="Property investment analysis dashboard" 
                className="w-full h-auto object-cover"
              />
            </Card>
            
            {/* Floating calculator preview - hidden on mobile to prevent overflow */}
            <Card className="absolute -bottom-6 -left-6 p-4 lg:p-6 shadow-large bg-card-elevated border-0 hidden sm:block">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-1.5 lg:p-2 bg-primary-soft rounded-lg">
                  <Calculator className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-xs lg:text-sm">{translations.calculator.title}</p>
                  <p className="text-primary text-base lg:text-lg font-bold">8.2% {translations.calculator.results.annualReturn}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ProcessWalkthrough 
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />
    </section>
  );
};

export default Hero;