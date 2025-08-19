import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, FileText, BarChart3, DollarSign, Building } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Features = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Calculator,
      title: t.advancedCalculator,
      description: t.advancedCalculatorDesc
    },
    {
      icon: TrendingUp,
      title: t.yieldAnalysisTitle,
      description: t.yieldAnalysisDesc
    },
    {
      icon: FileText,
      title: t.pdfReportsTitle,
      description: t.pdfReportsDesc
    },
    {
      icon: BarChart3,
      title: t.marketComparison,
      description: t.marketComparisonDesc
    },
    {
      icon: DollarSign,
      title: t.cashFlowTracking,
      description: t.cashFlowTrackingDesc
    },
    {
      icon: Building,
      title: t.portfolioManagement,
      description: t.portfolioManagementDesc
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.featuresTitle}
            <span className="text-primary block">{t.featuresTitleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.featuresDescription}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow duration-300 border-0 bg-card">
              <CardHeader>
                <div className="p-3 bg-primary-soft rounded-xl w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;