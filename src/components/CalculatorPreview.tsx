import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const CalculatorPreview = () => {
  const { t, language } = useLanguage();
  const [propertyValue, setPropertyValue] = useState(language === 'no' ? "2500000" : "300000");
  const [monthlyRent, setMonthlyRent] = useState(language === 'no' ? "18000" : "2200");
  const [monthlyExpenses, setMonthlyExpenses] = useState(language === 'no' ? "3500" : "450");

  const grossYield = ((parseFloat(monthlyRent) * 12) / parseFloat(propertyValue)) * 100;
  const netYield = (((parseFloat(monthlyRent) - parseFloat(monthlyExpenses)) * 12) / parseFloat(propertyValue)) * 100;
  const monthlyCashFlow = parseFloat(monthlyRent) - parseFloat(monthlyExpenses);

  return (
    <section id="calculator" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.calculatorTitle}
            <span className="text-primary block">{t.calculatorTitleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.calculatorDescription}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>{t.propertyDetails}</CardTitle>
                <CardDescription>
                  {t.propertyDetailsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="property-value">{t.propertyValue}</Label>
                  <Input
                    id="property-value"
                    type="number"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-rent">{t.monthlyRent}</Label>
                  <Input
                    id="monthly-rent"
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-expenses">{t.monthlyExpenses}</Label>
                  <Input
                    id="monthly-expenses"
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  {t.generateFullReport}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">{t.grossYield}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {grossYield.toFixed(2)}%
                  </p>
                  <p className="text-muted-foreground">
                    {t.grossYieldDesc}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-accent/20">
                <CardHeader>
                  <CardTitle className="text-accent">{t.netYield}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent">
                    {netYield.toFixed(2)}%
                  </p>
                  <p className="text-muted-foreground">
                    {t.netYieldDesc}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>{t.monthlyCashFlow}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {monthlyCashFlow.toLocaleString()} {t.currency}
                  </p>
                  <p className="text-muted-foreground">
                    {t.monthlyCashFlowDesc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorPreview;