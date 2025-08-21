import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator as CalcIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator';
import CalculatorModules from '@/components/calculator/CalculatorModules';
import { useCalculatorData } from '@/hooks/useCalculatorData';

const Calculator = () => {
  const { data, updateField, isModuleActivated, getReportData } = useCalculatorData();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: any) => {
    updateField(field, value);
  };

  const handleModuleActivation = (moduleId: string) => {
    // Activate the module by adding some data to it
    updateField('activated', true, moduleId);
  };

  const handleGenerateReport = () => {
    const reportData = getReportData();
    // Always activate basic profitability analysis if it's not already activated
    if (!isModuleActivated('Lönnsomhetsanalyse')) {
      updateField('activated', true, 'Lönnsomhetsanalyse');
    }
    
    // Navigate to bank report with current data
    navigate('/bank-report', { state: reportData });
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

        {/* Centered Property Details */}
        <div className="max-w-2xl mx-auto">
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

          {/* Generate Report Button */}
          {canShowResults && (
            <div className="mt-6 text-center">
              <Button size="lg" className="px-8" onClick={handleGenerateReport}>
                Generer fullstendig bankrapport
              </Button>
            </div>
          )}
        </div>

        {/* Module Selection Section */}
        {canShowResults && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">
                Bygg videre på rapporten
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Velg fra analysemodulene nedenfor for å utvide rapporten med mer detaljerte beregninger og analyser som banker ønsker å se
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
                <p className="text-sm text-primary font-medium">
                  💡 Tip: Jo flere moduler du bruker, desto mer omfattende og profesjonell blir din bankrapport
                </p>
              </div>
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
              onModuleActivate={handleModuleActivation}
              onGenerateReport={handleGenerateReport}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Calculator;