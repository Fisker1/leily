import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator as CalcIcon, CheckCircle2, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator';
import CalculatorModules from '@/components/calculator/CalculatorModules';
import { useCalculatorData } from '@/hooks/useCalculatorData';

const Calculator = () => {
  const { data, updateField, isModuleActivated, getReportData } = useCalculatorData();
  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation (if returning from module addition)
  const [locationState, setLocationState] = useState(location.state || {});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (location.state?.showModuleAdded) {
      setShowSuccessAlert(true);
      setLocationState(location.state);
      // Clear the state to prevent showing alert on refresh
      window.history.replaceState({}, document.title);
      // Auto-hide alert after 5 seconds
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  }, [location.state]);

  // Use location state data if available, otherwise use calculator data
  const calculatorData = {
    ...data,
    ...locationState
  };

  const selectedModules = locationState.selectedModules || [];

  const handleInputChange = (field: string, value: any) => {
    updateField(field, value);
    // Also update location state to maintain data
    setLocationState(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    // Navigate to bank report with current data and attached modules
    navigate('/bank-report', { 
      state: { 
        ...reportData,
        ...calculatorData,
        attachedModules: selectedModules,
        reportType: 'comprehensive'
      } 
    });
  };

  const loanAmount = parseFloat(calculatorData.loanAmount) || 0;
  const interestRate = parseFloat(calculatorData.interestRate) || 0;
  const loanPeriod = parseFloat(calculatorData.loanPeriod) || 0;
  const propertyValue = parseFloat(calculatorData.propertyValue) || 0;
  const monthlyRent = parseFloat(calculatorData.monthlyRent) || 0;
  
  // Calculate total monthly expenses using calculator data
  const totalExpenses = 
    (parseFloat(calculatorData.electricity) || 0) +
    (parseFloat(calculatorData.gridRent) || 0) +
    (parseFloat(calculatorData.commonCosts) || 0) +
    (parseFloat(calculatorData.municipalFees) || 0) +
    (parseFloat(calculatorData.internet) || 0) +
    (parseFloat(calculatorData.otherExpenses) || 0);

  const monthlyLoanPayment = loanAmount > 0 && interestRate > 0 
    ? (loanAmount * (interestRate / 100 / 12)) / (1 - Math.pow(1 + (interestRate / 100 / 12), -(loanPeriod * 12)))
    : 0;

  const canShowResults = propertyValue > 0 && 
    (calculatorData.calculatorMode === 'investment' ? monthlyRent > 0 : true);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Success Alert */}
        {showSuccessAlert && locationState.showModuleAdded && (
          <Alert className="max-w-2xl mx-auto border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{locationState.addedModuleName}</strong> er lagt til som vedlegg i rapporten. 
              Du kan nå velge flere moduler eller generere den komplette rapporten.
            </AlertDescription>
          </Alert>
        )}

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
                <Select value={calculatorData.calculatorMode} onValueChange={(value) => handleInputChange('calculatorMode', value)}>
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
                    value={calculatorData.propertyValue}
                    onChange={(e) => handleInputChange('propertyValue', e.target.value)}
                    placeholder="5000000"
                  />
              </div>

              {/* Monthly Rent - only for investment */}
              {calculatorData.calculatorMode === 'investment' && (
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Månedlig leieinntekt (NOK)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={calculatorData.monthlyRent}
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
                  value={calculatorData.loanAmount}
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
                  value={calculatorData.interestRate}
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
                  value={calculatorData.loanPeriod}
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
              {/* Show attached modules if any */}
              {selectedModules.length > 0 && (
                <Card className="bg-accent/5 border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-accent flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Vedlagte Moduler ({selectedModules.length})
                    </CardTitle>
                    <CardDescription>
                      Disse modulene er allerede lagt til som vedlegg i rapporten
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {selectedModules.map((module, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {module.title.split(' - ')[0]}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-foreground">
                  {selectedModules.length > 0 ? 'Utvid fullstendig bankrapport' : 'Utvid fullstendig bankrapport'}
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  {selectedModules.length > 0 
                    ? 'Fyll ut alle modulene nedenfor eller fjern de du ikke ønsker i rapporten'
                    : 'Klikk nedenfor for å få tilgang til alle analysemodulene og fylle dem ut i sekvens'
                  }
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-primary font-medium">
                    💡 Tip: Jo flere moduler du fyller ut, desto mer omfattende og profesjonell blir din bankrapport
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
                calculatorMode={calculatorData.calculatorMode}
                monthlyCashFlow={calculatorData.calculatorMode === 'investment' 
                  ? monthlyRent - totalExpenses - monthlyLoanPayment
                  : -totalExpenses - monthlyLoanPayment}
                onModuleActivate={handleModuleActivation}
                onGenerateReport={handleGenerateReport}
                selectedModules={selectedModules}
                calculatorData={calculatorData}
                onDataChange={handleInputChange}
              />

              {/* Generate Final Report Button */}
              {selectedModules.length > 0 && (
                <Card className="bg-gradient-soft border-primary/20 mt-8">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generer Komplett Bankrapport
                    </CardTitle>
                    <CardDescription>
                      Basert på grunnleggende data og {selectedModules.length} vedlagte analysemoduler
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
                      size="lg"
                      onClick={handleGenerateReport}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generer Komplett Rapport med {selectedModules.length} Vedlegg
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Rapporten vil inneholde alle valgte moduler som separate vedlegg
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
      </div>
    </>
  );
};

export default Calculator;