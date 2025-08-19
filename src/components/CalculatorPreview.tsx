import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import CalculatorModules from "./calculator/CalculatorModules";
import { useCalculatorData } from "@/hooks/useCalculatorData";

const CalculatorPreview = () => {
  const { translations, language } = useLanguage();
  const navigate = useNavigate();
  const { data, updateField, getReportData } = useCalculatorData();

  // Handle bank report generation
  const handleGenerateBankReport = () => {
    const reportData = getReportData();
    navigate('/bank-report', { state: reportData });
  };

  // Calculations
  const totalMonthlyExpenses = 
    parseFloat(data.electricity) + 
    parseFloat(data.gridRent) + 
    parseFloat(data.commonCosts) + 
    parseFloat(data.municipalFees) + 
    parseFloat(data.internet) + 
    parseFloat(data.otherExpenses);

  const actualPropertyValue = data.isRenovation 
    ? parseFloat(data.propertyValue) + parseFloat(data.renovationCost)
    : parseFloat(data.propertyValue);
  
  const finalPropertyValue = data.isRenovation 
    ? parseFloat(data.postRenovationValue) 
    : parseFloat(data.propertyValue);

  // Investment calculations
  const grossYield = data.calculatorMode === 'investment' 
    ? ((parseFloat(data.monthlyRent) * 12) / actualPropertyValue) * 100 
    : 0;
  
  const netYield = data.calculatorMode === 'investment' 
    ? (((parseFloat(data.monthlyRent) - totalMonthlyExpenses) * 12) / actualPropertyValue) * 100 
    : 0;

  // Loan calculations
  const monthlyInterest = parseFloat(data.interestRate) / 100 / 12;
  const numberOfPayments = parseFloat(data.loanPeriod) * 12;
  const monthlyLoanPayment = parseFloat(data.loanAmount) * 
    (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);

  // Cash flow calculation
  const monthlyCashFlow = data.calculatorMode === 'investment'
    ? parseFloat(data.monthlyRent) - totalMonthlyExpenses - monthlyLoanPayment
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
            <Tabs value={data.calculatorMode} onValueChange={(value) => updateField('calculatorMode', value as 'investment' | 'private')}>
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="investment">Investering</TabsTrigger>
                <TabsTrigger value="private">Privat</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
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
                      value={data.propertyValue}
                      onChange={(e) => updateField('propertyValue', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  
                  {data.calculatorMode === 'investment' && (
                    <div>
                      <Label htmlFor="monthly-rent">Månedlig leieinntekt (kr)</Label>
                      <Input
                        id="monthly-rent"
                        type="number"
                        value={data.monthlyRent}
                        onChange={(e) => updateField('monthlyRent', e.target.value)}
                        className="text-lg"
                      />
                    </div>
                  )}

                  {/* Renovation Toggle */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={data.isRenovation} 
                        onCheckedChange={(checked) => updateField('isRenovation', checked)}
                        id="renovation-mode"
                      />
                      <Label htmlFor="renovation-mode">Renoveringsobjekt</Label>
                    </div>
                    
                    {data.isRenovation && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <Label htmlFor="renovation-cost">Renoveringskostnad (kr)</Label>
                          <Input
                            id="renovation-cost"
                            type="number"
                            value={data.renovationCost}
                            onChange={(e) => updateField('renovationCost', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="post-renovation-value">Verdi etter renovering (kr)</Label>
                          <Input
                            id="post-renovation-value"
                            type="number"
                            value={data.postRenovationValue}
                            onChange={(e) => updateField('postRenovationValue', e.target.value)}
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
                          value={data.electricity}
                          onChange={(e) => updateField('electricity', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="grid-rent">Nettleie (kr)</Label>
                        <Input
                          id="grid-rent"
                          type="number"
                          value={data.gridRent}
                          onChange={(e) => updateField('gridRent', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="common-costs">Fellesutgifter (kr)</Label>
                        <Input
                          id="common-costs"
                          type="number"
                          value={data.commonCosts}
                          onChange={(e) => updateField('commonCosts', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="municipal-fees">Kommunale avgifter (kr)</Label>
                        <Input
                          id="municipal-fees"
                          type="number"
                          value={data.municipalFees}
                          onChange={(e) => updateField('municipalFees', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="internet">Internett (kr)</Label>
                        <Input
                          id="internet"
                          type="number"
                          value={data.internet}
                          onChange={(e) => updateField('internet', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="other-expenses">Andre utgifter (kr)</Label>
                        <Input
                          id="other-expenses"
                          type="number"
                          value={data.otherExpenses}
                          onChange={(e) => updateField('otherExpenses', e.target.value)}
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
                        value={data.loanAmount}
                        onChange={(e) => updateField('loanAmount', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="interest-rate">Rente (%)</Label>
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.1"
                        value={data.interestRate}
                        onChange={(e) => updateField('interestRate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="loan-period">Nedbetalingstid (år)</Label>
                      <Input
                        id="loan-period"
                        type="number"
                        value={data.loanPeriod}
                        onChange={(e) => updateField('loanPeriod', e.target.value)}
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

              <Button 
                className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6"
                onClick={handleGenerateBankReport}
              >
                Generer Fullstendig Bankerapp
              </Button>
            </div>

            {/* Calculator Modules */}
            <div className="lg:col-span-3">
              <CalculatorModules
                propertyValue={actualPropertyValue}
                monthlyRent={parseFloat(data.monthlyRent)}
                expenses={totalMonthlyExpenses}
                loanAmount={parseFloat(data.loanAmount)}
                interestRate={parseFloat(data.interestRate)}
                loanPeriod={parseFloat(data.loanPeriod)}
                monthlyLoanPayment={monthlyLoanPayment}
                calculatorMode={data.calculatorMode}
                monthlyCashFlow={monthlyCashFlow}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorPreview;