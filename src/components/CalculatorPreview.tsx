import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const CalculatorPreview = () => {
  const { translations, language } = useLanguage();
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
            {translations.calculator.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {translations.calculator.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Eiendomsdetaljer</CardTitle>
                <CardDescription>
                  Skriv inn eiendomsinformasjon for å beregne investeringsmålinger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="property-value">{translations.calculator.propertyValue}</Label>
                  <Input
                    id="property-value"
                    type="number"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-rent">{translations.calculator.monthlyRent}</Label>
                  <Input
                    id="monthly-rent"
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-expenses">Månedlige Utgifter (kr)</Label>
                  <Input
                    id="monthly-expenses"
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Generer Full Rapport
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Brutto Avkastning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {grossYield.toFixed(2)}%
                  </p>
                  <p className="text-muted-foreground">
                    Årlig avkastning før utgifter
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-accent/20">
                <CardHeader>
                  <CardTitle className="text-accent">Netto Avkastning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent">
                    {netYield.toFixed(2)}%
                  </p>
                  <p className="text-muted-foreground">
                    Årlig avkastning etter utgifter
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>{translations.calculator.results.monthlyReturn}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {monthlyCashFlow.toLocaleString()} kr
                  </p>
                  <p className="text-muted-foreground">
                    Netto månedlig inntekt
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