import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator as CalcIcon } from 'lucide-react';
import Navigation from '@/components/Navigation';
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator';
import CalculatorModules from '@/components/calculator/CalculatorModules';
import { useCalculatorData } from '@/hooks/useCalculatorData';

const Calculator = () => {
  const { data, updateField } = useCalculatorData();

  const handleInputChange = (field: string, value: any) => {
    updateField(field, value);
  };

  const loanAmount = parseFloat(data.loanAmount) || 0;
  const interestRate = parseFloat(data.interestRate) || 0;
  const loanPeriod = parseFloat(data.loanPeriod) || 0;
  const propertyValue = parseFloat(data.propertyValue) || 0;
  const monthlyRent = parseFloat(data.monthlyRent) || 0;
  
  // Calculate total monthly expenses
  const totalExpenses = 
    (parseFloat(data.electricity) || 0) +
    (parseFloat(data.gridRent) || 0) +
    (parseFloat(data.commonCosts) || 0) +
    (parseFloat(data.municipalFees) || 0) +
    (parseFloat(data.internet) || 0) +
    (parseFloat(data.otherExpenses) || 0);

  const monthlyLoanPayment = loanAmount > 0 && interestRate > 0 
    ? (loanAmount * (interestRate / 100 / 12)) / (1 - Math.pow(1 + (interestRate / 100 / 12), -(loanPeriod * 12)))
    : 0;

  const canShowResults = propertyValue > 0 && 
    (data.calculatorMode === 'investment' ? monthlyRent > 0 : true);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <CalcIcon className="h-10 w-10 text-primary" />
            Eiendomskalkulator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyserer lønnsomheten
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property Details - Center */}
          <div className="lg:col-span-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="text-primary">Eiendomsdetaljer</CardTitle>
                <CardDescription>
                  Fyll inn informasjon om eiendommen du vurderer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calculator Mode */}
                <div className="space-y-2">
                  <Label htmlFor="calculatorMode">Type investering</Label>
                  <Select value={data.calculatorMode} onValueChange={(value) => handleInputChange('calculatorMode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investment">Utleieeiendom</SelectItem>
                      <SelectItem value="private">Privat bolig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Value */}
                <div className="space-y-2">
                  <Label htmlFor="propertyValue">Kjøpesum (NOK)</Label>
                  <Input
                    id="propertyValue"
                    type="number"
                    value={data.propertyValue}
                    onChange={(e) => handleInputChange('propertyValue', e.target.value)}
                    placeholder="5000000"
                  />
                </div>

                {/* Monthly Rent - only for investment */}
                {data.calculatorMode === 'investment' && (
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRent">Månedlig leieinntekt (NOK)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={data.monthlyRent}
                      onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                      placeholder="25000"
                    />
                  </div>
                )}

                {/* Total Expenses Display */}
                <div className="space-y-2">
                  <Label>Totale månedlige utgifter</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-lg font-semibold">{totalExpenses.toLocaleString()} kr</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Basert på strøm, nettleie, felleskostnader, kommunale avgifter, internett og andre utgifter
                    </p>
                  </div>
                </div>

                {/* Loan Amount */}
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Lånebeløp (NOK)</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={data.loanAmount}
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    placeholder="4000000"
                  />
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Rente (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={data.interestRate}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    placeholder="4.5"
                  />
                </div>

                {/* Loan Period */}
                <div className="space-y-2">
                  <Label htmlFor="loanPeriod">Låneperiode (år)</Label>
                  <Input
                    id="loanPeriod"
                    type="number"
                    value={data.loanPeriod}
                    onChange={(e) => handleInputChange('loanPeriod', e.target.value)}
                    placeholder="30"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Small Profitability Preview - Right Side */}
          <div className="lg:col-span-1">
            {canShowResults ? (
              <Card className="shadow-medium h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Lønnsomhet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProfitabilityCalculator
                    propertyValue={propertyValue}
                    monthlyRent={monthlyRent}
                    expenses={totalExpenses}
                    loanAmount={loanAmount}
                    monthlyLoanPayment={monthlyLoanPayment}
                    calculatorMode={data.calculatorMode}
                    compact={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-medium h-fit">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <CalcIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Fyll inn eiendomsdetaljene for å se preview
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Module Selection Section */}
        {canShowResults && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Bygg på rapporten ytterligere med flere analysemoduler
              </h2>
              <p className="text-muted-foreground">
                Velg analysemodul for å utdype rapporten
              </p>
            </div>
            
            <CalculatorModules
              propertyValue={propertyValue}
              monthlyRent={monthlyRent}
              expenses={totalExpenses}
              loanAmount={loanAmount}
              interestRate={interestRate}
              loanPeriod={loanPeriod}
              monthlyLoanPayment={monthlyLoanPayment}
              calculatorMode={data.calculatorMode}
              monthlyCashFlow={data.calculatorMode === 'investment' 
                ? monthlyRent - totalExpenses - monthlyLoanPayment
                : -totalExpenses - monthlyLoanPayment}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Calculator;