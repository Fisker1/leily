import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator as CalcIcon, CheckCircle2, FileText, Ruler } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator';
import CalculatorModules from '@/components/calculator/CalculatorModules';
import BuildingPlannerBasic from '@/components/BuildingPlannerBasic';
import { useCalculatorData } from '@/hooks/useCalculatorData';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscription } from '@/hooks/useSubscription';
import { Slider } from '@/components/ui/slider';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';

const Calculator = () => {
  const {
    data,
    updateField,
    isModuleActivated,
    getReportData
  } = useCalculatorData();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const { isPro } = useSubscription();
  const { toast } = useToast();

  // Access control
  const canAccessBuildingPlanner = isPro;
  const canAccessExtendedReport = isAdmin;

  // Get state from navigation (if returning from module addition)
  const [locationState, setLocationState] = useState(location.state || {});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoanAmountManuallyEdited, setIsLoanAmountManuallyEdited] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator"); // calculator | building-planner
  
  const handleTabChange = (value: string) => {
    if (value === "building-planner" && !canAccessBuildingPlanner) {
      toast({
        title: "Byggeplanlegger (Pro)",
        description: "Oppgrader til Pro for å få tilgang til den avanserte byggeplanleggeren.",
        duration: 4000,
      });
      return;
    }
    setActiveTab(value);
  };
  
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
  
  // Auto-calculate loan amount when total price or equity changes (unless manually edited)
  useEffect(() => {
    if (!isLoanAmountManuallyEdited && calculatorData.totalPrice && calculatorData.equity) {
      const totalPrice = parseFloat(calculatorData.totalPrice) || 0;
      const equity = parseFloat(calculatorData.equity) || 0;
      const autoLoanAmount = Math.max(0, totalPrice - equity);
      
      if (autoLoanAmount !== (parseFloat(calculatorData.loanAmount) || 0)) {
        updateField('loanAmount', autoLoanAmount.toString());
        setLocationState(prev => ({
          ...prev,
          loanAmount: autoLoanAmount.toString()
        }));
      }
    }
  }, [calculatorData.totalPrice, calculatorData.equity, isLoanAmountManuallyEdited, updateField]);

  const selectedModules = locationState.selectedModules || [];
  const handleInputChange = (field: string, value: any) => {
    updateField(field, value);
    // Also update location state to maintain data
    setLocationState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Track if loan amount is manually edited
    if (field === 'loanAmount') {
      setIsLoanAmountManuallyEdited(true);
    }
    
    // Reset manual edit flag when total price or equity changes
    if (field === 'totalPrice' || field === 'equity') {
      setIsLoanAmountManuallyEdited(false);
    }
  };
  
  const handleModuleActivation = (moduleId: string) => {
    // Activate the module by adding some data to it
    updateField('activated', true, moduleId);
  };
  
  const handleGenerateReport = () => {
    // Debug logging to check what data we have
    console.log('Calculator Data:', calculatorData);
    console.log('Total Price:', calculatorData.totalPrice);
    console.log('Parsed Total Price:', parseFloat(calculatorData.totalPrice));
    
    // Generate basic report using simple property details only
    const basicReportData = {
      basicData: {
        propertyType: calculatorData.propertyType,
        tomannsboligType: calculatorData.tomannsboligType,
        propertyValue: parseFloat(calculatorData.totalPrice) || 0,
        equity: parseFloat(calculatorData.equity) || 0,
        loanAmount: parseFloat(calculatorData.loanAmount) || 0,
        interestRate: parseFloat(calculatorData.interestRate) || 0,
        loanPeriod: parseFloat(calculatorData.loanPeriod) || 0,
        isRental: calculatorData.isRental,
        expectedAnnualRent: parseFloat(calculatorData.expectedAnnualRent) || 0,
        monthlyRent: parseFloat(calculatorData.expectedAnnualRent) / 12 || 0,
        
        // Detailed expense breakdown
        municipalFees: parseFloat(calculatorData.municipalFees) || 0,
        electricityMonthly: parseFloat(calculatorData.electricityMonthly) || 0,
        insurance: parseFloat(calculatorData.insurance) || 0,
        sharedExpenses: parseFloat(calculatorData.sharedExpenses) || 0,
        expenses: totalExpenses,
        
        // Calculated values
        monthlyLoanPayment: monthlyLoanPayment,
        monthlyCashFlow: calculatorData.isRental ? parseFloat(calculatorData.expectedAnnualRent) / 12 - totalExpenses - monthlyLoanPayment : -totalExpenses - monthlyLoanPayment,
        grossYield: calculatorData.isRental && parseFloat(calculatorData.totalPrice) > 0 ? parseFloat(calculatorData.expectedAnnualRent) / parseFloat(calculatorData.totalPrice) * 100 : 0,
        loanToValue: parseFloat(calculatorData.totalPrice) > 0 ? (parseFloat(calculatorData.loanAmount) / parseFloat(calculatorData.totalPrice)) * 100 : 0,
        calculatorMode: calculatorData.isRental ? 'investment' : 'private'
      },
      activatedModules: ['Grunnleggende analyse'] // Only basic analysis
    };
    
    console.log('Basic Report Data:', basicReportData);
    
    navigate('/bank-report', {
      state: basicReportData
    });
  };
  
  const loanAmount = parseFloat(calculatorData.loanAmount) || 0;
  const interestRate = parseFloat(calculatorData.interestRate) || 0;
  const loanPeriod = parseFloat(calculatorData.loanPeriod) || 0;
  const totalPrice = parseFloat(calculatorData.totalPrice) || 0;
  const expectedAnnualRent = parseFloat(calculatorData.expectedAnnualRent) || 0;

  // Calculate total monthly expenses using calculator data
  const totalExpenses = (parseFloat(calculatorData.municipalFees) || 0) + (parseFloat(calculatorData.electricityMonthly) || 0) + (parseFloat(calculatorData.insurance) || 0) + (parseFloat(calculatorData.sharedExpenses) || 0);
  const monthlyLoanPayment = loanAmount > 0 && interestRate > 0 ? loanAmount * (interestRate / 100 / 12) / (1 - Math.pow(1 + interestRate / 100 / 12, -(loanPeriod * 12))) : 0;
  const canShowResults = totalPrice > 0 && (calculatorData.isRental ? expectedAnnualRent > 0 : true);

  // Calculate yield if rental property
  const yieldPercentage = calculatorData.isRental && totalPrice > 0 ? expectedAnnualRent / totalPrice * 100 : 0;
  
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Success Alert */}
        {showSuccessAlert && locationState.showModuleAdded && (
          <Alert className="max-w-2xl mx-auto border-green-200 bg-green-50 mb-8">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{locationState.addedModuleName}</strong> er lagt til som vedlegg i rapporten. 
              Du kan nå velge flere moduler eller generere den komplette rapporten.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <CalcIcon className="h-10 w-10 text-primary" />
            Eiendomskalkulator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyserer lønnsomheten
          </p>
        </div>

        {/* Tab selector */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto mb-8 h-auto p-2 gap-2">
            <TabsTrigger 
              value="calculator" 
              className="flex items-center justify-center gap-3 py-4 px-6 text-sm font-medium"
            >
              <CalcIcon className="h-5 w-5" />
              <span>Eiendomskalkulator</span>
            </TabsTrigger>
            <TabsTrigger 
              value="building-planner" 
              className="flex items-center justify-center gap-3 py-4 px-6 text-sm font-medium bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 data-[state=active]:bg-blue-500/25 dark:text-blue-300 dark:hover:bg-blue-500/30 dark:data-[state=active]:bg-blue-500/25"
            >
              <Ruler className="h-5 w-5" />
              <span>Byggeplanlegger</span>
              {!isPro && <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-8">
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
                  {/* Property Type */}
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Type bolig</Label>
                    <Select value={calculatorData.propertyType} onValueChange={value => handleInputChange('propertyType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg boligtype" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enebolig">Enebolig</SelectItem>
                        <SelectItem value="leilighet">Leilighet</SelectItem>
                        <SelectItem value="rekkehus">Rekkehus</SelectItem>
                        <SelectItem value="tomannsbolig">Tomannsbolig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tomannsbolig Type - only for tomannsbolig */}
                  {calculatorData.propertyType === 'tomannsbolig' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tomannsbolig-toggle" className="text-base font-medium">
                          Type tomannsbolig
                        </Label>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm ${calculatorData.tomannsboligType === 'vertikaldelt' ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                            Vertikaldelt
                          </span>
                          <Switch 
                            id="tomannsbolig-toggle" 
                            checked={calculatorData.tomannsboligType === 'horisontaldelt'} 
                            onCheckedChange={checked => handleInputChange('tomannsboligType', checked ? 'horisontaldelt' : 'vertikaldelt')} 
                          />
                          <span className={`text-sm ${calculatorData.tomannsboligType === 'horisontaldelt' ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                            Horisontaldelt
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                   {/* Total Price */}
                   <div className="space-y-2">
                     <Label htmlFor="totalPrice">Totalpris på eiendommen (NOK)</Label>
                     <CurrencyInput id="totalPrice" value={calculatorData.totalPrice} onChange={value => handleInputChange('totalPrice', value)} placeholder="5 000 000" />
                   </div>

                   {/* Equity */}
                   <div className="space-y-2">
                     <Label htmlFor="equity">Egenkapital (NOK)</Label>
                     <CurrencyInput id="equity" value={calculatorData.equity} onChange={value => handleInputChange('equity', value)} placeholder="1 000 000" />
                   </div>

                  {/* Rental Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rental-toggle" className="text-base font-medium">
                        Bruksformål
                      </Label>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${!calculatorData.isRental ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                          Privat
                        </span>
                        <Switch id="rental-toggle" checked={calculatorData.isRental} onCheckedChange={checked => handleInputChange('isRental', checked)} />
                        <span className={`text-sm ${calculatorData.isRental ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                          Utleie
                        </span>
                      </div>
                    </div>
                  </div>

                   {/* Expected Monthly Rent - only for rental */}
                   {calculatorData.isRental && (
                     <div className="space-y-2">
                       <Label htmlFor="expectedMonthlyRent">Forventet leieinntekt i måneden (NOK)</Label>
                       <CurrencyInput 
                         id="expectedMonthlyRent" 
                         value={calculatorData.expectedAnnualRent ? (parseFloat(calculatorData.expectedAnnualRent) / 12).toString() : ''} 
                         onChange={value => handleInputChange('expectedAnnualRent', (parseFloat(value || '0') * 12).toString())} 
                         placeholder="25 000" 
                       />
                       {/* Yield Calculation */}
                       {totalPrice > 0 && expectedAnnualRent > 0 && (
                         <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                           <div className="flex justify-between items-center">
                             <span className="text-sm font-medium text-primary">Yield:</span>
                             <span className="text-lg font-bold text-primary">{yieldPercentage.toFixed(2)}%</span>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">
                             Beregnet som (månedlig leie × 12) / totalpris × 100
                           </p>
                         </div>
                       )}
                     </div>
                   )}

                  {/* Interest Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Rente (%)</Label>
                    <Input id="interestRate" type="number" step="0.1" value={calculatorData.interestRate} onChange={e => handleInputChange('interestRate', e.target.value)} placeholder="4.5" />
                  </div>

                   {/* Loan Amount */}
                   <div className="space-y-2">
                     <Label htmlFor="loanAmount">Lånebeløp (NOK)</Label>
                     <CurrencyInput 
                       id="loanAmount" 
                       value={calculatorData.loanAmount} 
                       onChange={value => handleInputChange('loanAmount', value)} 
                       placeholder="4 000 000" 
                     />
                     <p className="text-xs text-muted-foreground">
                       Beregnes automatisk som totalpris - egenkapital, men kan redigeres manuelt
                     </p>
                   </div>

                  {/* Loan Period */}
                  <div className="space-y-2">
                    <Label htmlFor="loanPeriod">Låneperiode (år)</Label>
                    <Input id="loanPeriod" type="number" value={calculatorData.loanPeriod} onChange={e => handleInputChange('loanPeriod', e.target.value)} placeholder="30" />
                  </div>

                  {/* Expenses Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-foreground">Utgifter</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                       {/* Municipal Fees */}
                       <div className="space-y-2">
                         <Label htmlFor="municipalFees">Kommunale avgifter (pr. mnd)</Label>
                         <CurrencyInput id="municipalFees" value={calculatorData.municipalFees} onChange={value => handleInputChange('municipalFees', value)} placeholder="1 500" />
                       </div>

                       {/* Monthly Electricity */}
                       <div className="space-y-2">
                         <Label htmlFor="electricityMonthly">Forventet strømbruk (pr. mnd)</Label>
                         <CurrencyInput id="electricityMonthly" value={calculatorData.electricityMonthly} onChange={value => handleInputChange('electricityMonthly', value)} placeholder="800" />
                       </div>

                       {/* Insurance */}
                       <div className="space-y-2">
                         <Label htmlFor="insurance">Forsikring (pr. mnd)</Label>
                         <CurrencyInput id="insurance" value={calculatorData.insurance} onChange={value => handleInputChange('insurance', value)} placeholder="500" />
                       </div>

                       {/* Shared Expenses */}
                       <div className="space-y-2">
                         <Label htmlFor="sharedExpenses">Fellesutgifter (internett/tv/annet) (pr. mnd)</Label>
                         <CurrencyInput id="sharedExpenses" value={calculatorData.sharedExpenses} onChange={value => handleInputChange('sharedExpenses', value)} placeholder="600" />
                       </div>
                    </div>

                    {/* Total Expenses Display */}
                    <div className="p-3 bg-muted rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Totale månedlige utgifter:</span>
                        <span className="text-lg font-semibold">{formatNumberWithSpaces(totalExpenses)} kr</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Report Button */}
              {canShowResults && (
                <div className="mt-6 text-center">
                  <Button size="lg" className="px-8" onClick={handleGenerateReport}>
                    Generer grunnleggende bankrapport
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Gratis rapport basert på dine grunnleggende eiendomsdata
                  </p>
                </div>
              )}
            </div>

            {/* Extended Bank Report Section - Always visible */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Utvidet Bankrapport
                    {!canAccessExtendedReport && <Badge variant="secondary" className="ml-2">Kommer snart</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {canAccessExtendedReport 
                      ? "Få tilgang til avanserte analyser og tilpassede rapporter"
                      : "Denne funksjonen er under utvikling og kommer snart!"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canAccessExtendedReport ? (
                    <>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => {
                          if (!user) {
                            navigate('/auth');
                            return;
                          }
                          if (profile?.subscription_tier !== 'pro') {
                            navigate('/pricing');
                            return;
                          }
                          // Handle extended report generation
                          console.log('Generate extended report');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generer Utvidet Bankrapport
                      </Button>
                      
                      {!user && (
                        <p className="text-xs text-muted-foreground text-center">
                          Du må logge inn for å få tilgang til utvidede rapporter
                        </p>
                      )}
                      
                      {user && profile?.subscription_tier !== 'pro' && (
                        <p className="text-xs text-muted-foreground text-center">
                          Oppgrader til Pro for å få tilgang til utvidede rapporter
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Vi jobber med å gjøre denne funksjonen tilgjengelig for alle brukere.
                      </p>
                      <Badge variant="outline" className="mt-2">Kommer snart</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                    {selectedModules.length > 0 ? 'Fyll ut alle modulene nedenfor eller fjern de du ikke ønsker i rapporten' : 'Klikk nedenfor for å få tilgang til alle analysemodulene og fylle dem ut i sekvens'}
                  </p>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="text-sm text-primary font-medium">
                      💡 Tip: Jo flere moduler du fyller ut, desto mer omfattende og profesjonell blir din bankrapport
                    </p>
                  </div>
                </div>
                
                <CalculatorModules 
                  propertyValue={totalPrice} 
                  monthlyRent={expectedAnnualRent / 12} 
                  expenses={totalExpenses} 
                  loanAmount={loanAmount} 
                  interestRate={interestRate} 
                  loanPeriod={loanPeriod} 
                  monthlyLoanPayment={monthlyLoanPayment} 
                  calculatorMode={calculatorData.isRental ? 'investment' : 'private'} 
                  monthlyCashFlow={calculatorData.isRental ? expectedAnnualRent / 12 - totalExpenses - monthlyLoanPayment : -totalExpenses - monthlyLoanPayment} 
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
                      <Button className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground" size="lg" onClick={handleGenerateReport}>
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
          </TabsContent>
          
          <TabsContent value="building-planner">
            {canAccessBuildingPlanner ? (
              <BuildingPlannerBasic />
            ) : (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <Ruler className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">Avansert Byggeplanlegger</h3>
                  <p className="text-muted-foreground">
                    Tegn og planlegg ditt byggeprosjekt med interaktiv planlegger. Kun tilgjengelig for Pro-brukere.
                  </p>
                  <Badge variant="outline">Pro</Badge>
                  <Button className="mt-4">
                    Oppgrader til Pro
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Calculator;