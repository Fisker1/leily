import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const CalculatorPreview = () => {
  const { translations, language } = useLanguage();
  
  // Mode selection (Investment vs Private)
  const [calculatorMode, setCalculatorMode] = useState<'investment' | 'private'>('investment');
  
  // Basic property data
  const [propertyValue, setPropertyValue] = useState(language === 'no' ? "2500000" : "300000");
  const [monthlyRent, setMonthlyRent] = useState(language === 'no' ? "18000" : "2200");
  
  // Renovation settings
  const [isRenovation, setIsRenovation] = useState(false);
  const [renovationCost, setRenovationCost] = useState("200000");
  const [postRenovationValue, setPostRenovationValue] = useState("2800000");
  
  // Monthly expenses breakdown
  const [electricity, setElectricity] = useState("800");
  const [gridRent, setGridRent] = useState("400");
  const [commonCosts, setCommonCosts] = useState("1500");
  const [municipalFees, setMunicipalFees] = useState("600");
  const [internet, setInternet] = useState("300");
  const [otherExpenses, setOtherExpenses] = useState("400");
  
  // Loan calculator
  const [loanAmount, setLoanAmount] = useState("2000000");
  const [interestRate, setInterestRate] = useState("4.5");
  const [loanPeriod, setLoanPeriod] = useState("25");

  // Calculations
  const totalMonthlyExpenses = 
    parseFloat(electricity) + 
    parseFloat(gridRent) + 
    parseFloat(commonCosts) + 
    parseFloat(municipalFees) + 
    parseFloat(internet) + 
    parseFloat(otherExpenses);

  const actualPropertyValue = isRenovation 
    ? parseFloat(propertyValue) + parseFloat(renovationCost)
    : parseFloat(propertyValue);
  
  const finalPropertyValue = isRenovation 
    ? parseFloat(postRenovationValue) 
    : parseFloat(propertyValue);

  // Investment calculations
  const grossYield = calculatorMode === 'investment' 
    ? ((parseFloat(monthlyRent) * 12) / actualPropertyValue) * 100 
    : 0;
  
  const netYield = calculatorMode === 'investment' 
    ? (((parseFloat(monthlyRent) - totalMonthlyExpenses) * 12) / actualPropertyValue) * 100 
    : 0;

  // Loan calculations
  const monthlyInterest = parseFloat(interestRate) / 100 / 12;
  const numberOfPayments = parseFloat(loanPeriod) * 12;
  const monthlyLoanPayment = parseFloat(loanAmount) * 
    (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);

  // Cash flow calculation
  const monthlyCashFlow = calculatorMode === 'investment'
    ? parseFloat(monthlyRent) - totalMonthlyExpenses - monthlyLoanPayment
    : -totalMonthlyExpenses - monthlyLoanPayment;

  return (
    <section id="calculator" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Avansert Eiendomskalkulator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beregn avkastning, cashflow og generer bankreporter for eiendomsinvesteringer
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mode Selector */}
          <div className="mb-8">
            <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as 'investment' | 'private')}>
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="investment">Investering</TabsTrigger>
                <TabsTrigger value="private">Privat</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Property Info */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Eiendomsdetaljer</CardTitle>
                  <CardDescription>
                    Grunnleggende informasjon om eiendommen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="property-value">Kjøpesum (kr)</Label>
                    <Input
                      id="property-value"
                      type="number"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  
                  {calculatorMode === 'investment' && (
                    <div>
                      <Label htmlFor="monthly-rent">Månedlig leieinntekt (kr)</Label>
                      <Input
                        id="monthly-rent"
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(e.target.value)}
                        className="text-lg"
                      />
                    </div>
                  )}

                  {/* Renovation Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={isRenovation} 
                        onCheckedChange={setIsRenovation}
                        id="renovation-mode"
                      />
                      <Label htmlFor="renovation-mode">Renoveringsobjekt</Label>
                    </div>
                    
                    {isRenovation && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <Label htmlFor="renovation-cost">Renoveringskostnad (kr)</Label>
                          <Input
                            id="renovation-cost"
                            type="number"
                            value={renovationCost}
                            onChange={(e) => setRenovationCost(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="post-renovation-value">Verdi etter renovering (kr)</Label>
                          <Input
                            id="post-renovation-value"
                            type="number"
                            value={postRenovationValue}
                            onChange={(e) => setPostRenovationValue(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Expenses */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Månedlige utgifter</CardTitle>
                  <CardDescription>
                    Detaljert oversikt over driftsutgifter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="electricity">Strøm (kr)</Label>
                      <Input
                        id="electricity"
                        type="number"
                        value={electricity}
                        onChange={(e) => setElectricity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="grid-rent">Nettleie (kr)</Label>
                      <Input
                        id="grid-rent"
                        type="number"
                        value={gridRent}
                        onChange={(e) => setGridRent(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="common-costs">Fellesutgifter (kr)</Label>
                      <Input
                        id="common-costs"
                        type="number"
                        value={commonCosts}
                        onChange={(e) => setCommonCosts(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="municipal-fees">Kommunale avgifter (kr)</Label>
                      <Input
                        id="municipal-fees"
                        type="number"
                        value={municipalFees}
                        onChange={(e) => setMunicipalFees(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="internet">Internett (kr)</Label>
                      <Input
                        id="internet"
                        type="number"
                        value={internet}
                        onChange={(e) => setInternet(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="other-expenses">Andre utgifter (kr)</Label>
                      <Input
                        id="other-expenses"
                        type="number"
                        value={otherExpenses}
                        onChange={(e) => setOtherExpenses(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Totalt månedlig: <span className="font-semibold">{totalMonthlyExpenses.toLocaleString()} kr</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Calculator */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Lånekalkulator</CardTitle>
                  <CardDescription>
                    Beregn månedlige lånebetalinger
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="loan-amount">Lånebeløp (kr)</Label>
                      <Input
                        id="loan-amount"
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="interest-rate">Rente (%)</Label>
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="loan-period">Nedbetalingstid (år)</Label>
                      <Input
                        id="loan-period"
                        type="number"
                        value={loanPeriod}
                        onChange={(e) => setLoanPeriod(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Månedlig betaling: <span className="font-semibold">{monthlyLoanPayment.toLocaleString()} kr</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6">
                Generer Fullstendig Bankerapp
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {calculatorMode === 'investment' && (
                <>
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
                </>
              )}

              <Card className={`shadow-medium ${monthlyCashFlow >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <CardHeader>
                  <CardTitle className={monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Månedlig Cashflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyCashFlow >= 0 ? '+' : ''}{monthlyCashFlow.toLocaleString()} kr
                  </p>
                  <p className="text-muted-foreground">
                    {monthlyCashFlow >= 0 ? 'Positiv cashflow' : 'Negativ cashflow'}
                  </p>
                </CardContent>
              </Card>

              {calculatorMode === 'investment' && isRenovation && (
                <Card className="shadow-medium border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-blue-600">Renovering ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {(((parseFloat(postRenovationValue) - parseFloat(propertyValue) - parseFloat(renovationCost)) / parseFloat(renovationCost)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-muted-foreground">
                      Avkastning på renovering
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Sammendrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total investering:</span>
                    <span className="font-semibold">{actualPropertyValue.toLocaleString()} kr</span>
                  </div>
                  {calculatorMode === 'investment' && (
                    <div className="flex justify-between">
                      <span>Månedlig leieinntekt:</span>
                      <span className="font-semibold">{parseFloat(monthlyRent).toLocaleString()} kr</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Månedlige utgifter:</span>
                    <span className="font-semibold">{totalMonthlyExpenses.toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Månedlig lålebetaling:</span>
                    <span className="font-semibold">{monthlyLoanPayment.toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Netto månedlig:</span>
                    <span className={monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {monthlyCashFlow >= 0 ? '+' : ''}{monthlyCashFlow.toLocaleString()} kr
                    </span>
                  </div>
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