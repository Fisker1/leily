import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calculator as CalcIcon, CheckCircle2, FileText, Ruler, Library, Save, Plus, Wallet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ProfitabilityCalculator from '@/components/calculator/ProfitabilityCalculator';
import CalculatorModules from '@/components/calculator/CalculatorModules';
import BuildingPlannerBasic from '@/components/BuildingPlannerBasic';
import CalculationLibrary from '@/components/CalculationLibrary';
import FinnPropertyFetcher from '@/components/calculator/FinnPropertyFetcher';
import { useCalculatorData } from '@/hooks/useCalculatorData';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { ExtendedDetailsDialog } from '@/components/ExtendedDetailsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscription } from '@/hooks/useSubscription';
import { Slider } from '@/components/ui/slider';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';
import { FinnPropertyData } from '@/types/finn';
import { LoanCalculator } from '@/components/LoanCalculator';
import { ElectricityEstimator } from '@/components/ElectricityEstimator';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';

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
  const { saveCalculation } = useCalculationHistory();
  const { equityData } = useLoanCalculator(); // Get default loan settings

  // States for save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [extendedDetailsOpen, setExtendedDetailsOpen] = useState(false);
  const [calculationName, setCalculationName] = useState('');
  const [finnCode, setFinnCode] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [autoFetchedData, setAutoFetchedData] = useState<FinnPropertyData | null>(null);
  const [manualOverride, setManualOverride] = useState<{[key: string]: boolean}>({});

  // Access control
  const canAccessBuildingPlanner = isPro;
  const canAccessExtendedReport = isAdmin;
  const canAccessLoanCalculator = isPro;

  // Get state from navigation (if returning from module addition)
  const [locationState, setLocationState] = useState(location.state || {});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoanAmountManuallyEdited, setIsLoanAmountManuallyEdited] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator"); // calculator | building-planner | library
  const [showProFeatures, setShowProFeatures] = useState(false);
  
  const handleTabChange = (value: string) => {
    if (value === "building-planner" && !canAccessBuildingPlanner) {
      toast({
        title: "Byggeplanlegger (Pro)",
        description: "Oppgrader til Pro för å få tilgang til den avanserte byggeplanleggeren.",
        duration: 4000,
      });
      return;
    }
    setActiveTab(value);
  };

  const handleFinnPropertyDataReceived = (data: FinnPropertyData) => {
    setAutoFetchedData(data);
    setFinnCode(data.finnCode);
    setPropertyAddress(data.address);
    
    // Auto-fill calculator fields if not manually overridden
    if (!manualOverride.totalPrice) {
      handleInputChange('totalPrice', data.price.toString());
    }
    if (!manualOverride.propertyType) {
      handleInputChange('propertyType', data.propertyType);
    }
    if (!manualOverride.municipalFees && data.municipalFees) {
      handleInputChange('municipalFees', data.municipalFees.toString());
    }
    if (!manualOverride.sharedExpenses && data.sharedCosts) {
      handleInputChange('sharedExpenses', data.sharedCosts.toString());
    }
    
    // Auto-fill rental information if available
    if (data.monthlyRent && !manualOverride.expectedAnnualRent) {
      handleInputChange('isRental', true);
      handleInputChange('expectedAnnualRent', (data.monthlyRent * 12).toString());
    }

    // Auto-fill loan settings from saved defaults
    if (equityData && !manualOverride.interestRate) {
      handleInputChange('interestRate', equityData.default_interest_rate?.toString() || '4.5');
    }
    if (equityData && !manualOverride.loanPeriod) {
      handleInputChange('loanPeriod', equityData.default_loan_period_years?.toString() || '30');
    }
    // Auto-calculate equity based on default percentage
    if (equityData && data.price && !manualOverride.equity) {
      const defaultEquityPercent = equityData.default_equity_percentage || 20;
      const calculatedEquity = (data.price * defaultEquityPercent) / 100;
      handleInputChange('equity', calculatedEquity.toString());
    }

    toast({
      title: "Eiendomsdata importert",
      description: `Data fra Finn.no er fylt inn i kalkulatoren${data.monthlyRent ? ' (utleiebolig detektert)' : ''}. Du kan fortsatt redigere verdiene.`,
    });
  };

  const handleSaveCalculation = async () => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må logge inn for å lagre kalkulasjoner",
        variant: "destructive",
      });
      return;
    }

    // Prepare calculation data
    const calculationData = {
      ...calculatorData,
      finnCode: finnCode || null,
      propertyAddress: propertyAddress || null
    };

    // Prepare results data
    const resultsData = {
      totalPrice: parseFloat(calculatorData.totalPrice) || 0,
      monthlyRent: calculatorData.isRental ? parseFloat(calculatorData.expectedAnnualRent) / 12 || 0 : 0,
      yield: calculatorData.isRental && parseFloat(calculatorData.totalPrice) > 0 
        ? (parseFloat(calculatorData.expectedAnnualRent) / parseFloat(calculatorData.totalPrice) * 100) 
        : 0,
      monthlyCashFlow: calculatorData.isRental 
        ? parseFloat(calculatorData.expectedAnnualRent) / 12 - totalExpenses - monthlyLoanPayment 
        : -totalExpenses - monthlyLoanPayment,
      monthlyLoanPayment,
      totalExpenses,
      isRental: calculatorData.isRental
    };

    const saved = await saveCalculation(
      calculationName || `Kalkulasjon ${new Date().toLocaleDateString('no-NO')}`,
      finnCode || null,
      propertyAddress || null,
      calculationData,
      resultsData
    );

    if (saved) {
      setSaveDialogOpen(false);
      setCalculationName('');
      setFinnCode('');
      setPropertyAddress('');
    }
  };

  const handleLoadCalculation = (calculation: any) => {
    // Load the calculation data into the form
    const data = calculation.calculation_data;
    Object.keys(data).forEach(key => {
      if (key === 'finnCode') {
        setFinnCode(data[key] || '');
      } else if (key === 'propertyAddress') {
        setPropertyAddress(data[key] || '');
      } else {
        updateField(key, data[key]);
      }
    });

    toast({
      title: "Kalkulasjon lastet",
      description: "Kalkulasjonen er lastet inn i skjemaet",
    });
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
    
    // Track manual overrides for auto-fetched data
    if (autoFetchedData) {
      setManualOverride(prev => ({
        ...prev,
        [field]: true
      }));
    }
    
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
          <TabsList className="grid w-full grid-cols-3 sm:max-w-3xl mx-auto mb-8 h-auto p-2 gap-2">
            <TabsTrigger 
              value="calculator" 
              className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm font-medium"
            >
              <CalcIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Eiendomskalkulator</span>
            </TabsTrigger>
            <TabsTrigger 
              value="library" 
              className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm font-medium"
            >
              <Library className="h-5 w-5" />
              <span className="hidden sm:inline">Bibliotek</span>
            </TabsTrigger>
            <TabsTrigger 
              value="building-planner" 
              className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6 text-sm font-medium"
            >
              <Ruler className="h-5 w-5" />
              <span className="hidden sm:inline">Byggeplanlegger</span>
              {!isPro && <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs hidden sm:inline-flex">Pro</Badge>}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="space-y-8">
            {/* Pro Features Toggle - Only for Pro users */}
            {isPro && (
              <div className="max-w-2xl mx-auto">
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Badge variant="secondary" className="font-semibold">PRO</Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Pro-instillinger</h3>
                          <p className="text-sm text-muted-foreground">
                            Automatisk henting fra Finn og lånekalkulator
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={showProFeatures}
                        onCheckedChange={setShowProFeatures}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Finn Property Fetcher - Only visible when Pro features are enabled */}
            {isPro && showProFeatures && (
              <div className="max-w-2xl mx-auto">
                <FinnPropertyFetcher
                  onPropertyDataReceived={handleFinnPropertyDataReceived}
                  initialFinnCode={finnCode}
                  className="mb-6"
                />
              </div>
            )}

            {/* Loan Calculator - Only visible when Pro features are enabled */}
            {isPro && showProFeatures && (
              <div className="max-w-2xl mx-auto">
                <LoanCalculator />
              </div>
            )}

            {/* Centered Property Details */}
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-primary">Eiendomsdetaljer</CardTitle>
                  <CardDescription>
                    {isPro 
                      ? "Fyll inn informasjon manuelt eller bruk automatisk henting ovenfor" 
                      : "Fyll inn informasjon om eiendommen du vurderer"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Finn Code */}
                  <div className="space-y-2">
                    <Label htmlFor="finnCode">Finn-kode (valgfritt)</Label>
                    <Input 
                      id="finnCode" 
                      value={finnCode} 
                      onChange={e => setFinnCode(e.target.value)} 
                      placeholder="123456789" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Legg inn Finn-kode for å koble kalkulasjonen til en spesifikk annonse
                    </p>
                  </div>

                  {/* Property Address */}
                  <div className="space-y-2">
                    <Label htmlFor="propertyAddress">Eiendomsadresse (valgfritt)</Label>
                    <Input 
                      id="propertyAddress" 
                      value={propertyAddress} 
                      onChange={e => setPropertyAddress(e.target.value)} 
                      placeholder="Storgata 1, 0155 Oslo" 
                    />
                  </div>

                  {/* Property Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="propertyType">Type bolig</Label>
                      {autoFetchedData && !manualOverride.propertyType && (
                        <Badge variant="outline" className="text-xs">
                          Auto-hentet
                        </Badge>
                      )}
                    </div>
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
                     <div className="flex items-center gap-2">
                       <Label htmlFor="totalPrice">Totalpris på eiendommen (NOK)</Label>
                       {autoFetchedData && !manualOverride.totalPrice && (
                         <Badge variant="outline" className="text-xs">
                           Auto-hentet
                         </Badge>
                       )}
                     </div>
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
                 </CardContent>
               </Card>
             </div>

            {/* Expenses Section */}
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-primary">Utgifter</CardTitle>
                  <CardDescription>
                    Månedlige utgifter knyttet til eiendommen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Utgifter</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                       {/* Municipal Fees */}
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor="municipalFees">Kommunale avgifter (pr. mnd)</Label>
                           {autoFetchedData && !manualOverride.municipalFees && (
                             <Badge variant="outline" className="text-xs">
                               Auto-hentet
                             </Badge>
                           )}
                         </div>
                         <CurrencyInput id="municipalFees" value={calculatorData.municipalFees} onChange={value => handleInputChange('municipalFees', value)} placeholder="1 500" />
                       </div>

                       {/* Monthly Electricity */}
                       <div className="space-y-2">
                          <Label htmlFor="electricityMonthly">Forventet strømbruk (pr. mnd)</Label>
                          <CurrencyInput id="electricityMonthly" value={calculatorData.electricityMonthly} onChange={value => handleInputChange('electricityMonthly', value)} placeholder="800" />
                        </div>

                        {/* AI Electricity Estimator - Pro Feature */}
                        {isPro && (
                          <ElectricityEstimator
                            size_sqm={autoFetchedData?.livingArea || undefined}
                            bedrooms={autoFetchedData?.bedrooms || undefined}
                            property_type={calculatorData.propertyType}
                            location={autoFetchedData?.neighborhood || undefined}
                            onEstimateComplete={(cost) => {
                              if (!manualOverride.electricityMonthly) {
                                handleInputChange('electricityMonthly', cost.toString());
                              }
                            }}
                            disabled={!calculatorData.propertyType}
                          />
                        )}

                       {/* Insurance */}
                       <div className="space-y-2">
                         <Label htmlFor="insurance">Forsikring (pr. mnd)</Label>
                         <CurrencyInput id="insurance" value={calculatorData.insurance} onChange={value => handleInputChange('insurance', value)} placeholder="500" />
                       </div>

                       {/* Shared Expenses */}
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor="sharedExpenses">Fellesutgifter (internett/tv/annet) (pr. mnd)</Label>
                           {autoFetchedData && !manualOverride.sharedExpenses && (
                             <Badge variant="outline" className="text-xs">
                               Auto-hentet
                             </Badge>
                           )}
                         </div>
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
             </div>

            {/* Generate Report Button - Always visible */}
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button 
                    size="lg" 
                    className={`w-full sm:w-auto px-8 ${!canShowResults ? 'opacity-50' : ''}`}
                    onClick={handleGenerateReport}
                    disabled={!canShowResults}
                  >
                    Generer grunnleggende bankrapport
                  </Button>
                  {user && (
                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className={`w-full sm:w-auto px-8 ${!canShowResults ? 'opacity-50' : ''}`}
                          disabled={!canShowResults}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Lagre kalkulasjon
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Lagre kalkulasjon</DialogTitle>
                          <DialogDescription>
                            Lagre denne kalkulasjonen til biblioteket ditt for senere bruk
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="calc-name">Kalkulasjonsnavn</Label>
                            <Input 
                              id="calc-name"
                              value={calculationName}
                              onChange={e => setCalculationName(e.target.value)}
                              placeholder="Gi kalkulasjonen et navn..."
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                              Avbryt
                            </Button>
                            <Button onClick={handleSaveCalculation}>
                              Lagre
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {canShowResults ? (
                  <p className="text-xs text-muted-foreground">
                    Gratis rapport basert på dine grunnleggende eiendomsdata
                  </p>
                ) : (
                  <p className="text-xs text-orange-600">
                    Fyll inn {totalPrice <= 0 ? 'totalpris' : ''}{totalPrice <= 0 && calculatorData.isRental && expectedAnnualRent <= 0 ? ' og ' : ''}{calculatorData.isRental && expectedAnnualRent <= 0 ? 'forventet årlig leie' : ''} for å generere rapport
                  </p>
                )}
              </div>
            </div>


            {/* Pro Section - Always visible */}
            <div className="text-center space-y-4 mt-8">
              <h2 className="text-2xl font-bold text-foreground">
                Utvid fullstendig bankrapport
              </h2>
              <p className="text-sm text-muted-foreground">
                Legg til utvidede detaljer for en komplett analyse
              </p>
              {isPro ? (
                <Button 
                  size="lg" 
                  className="px-8 py-4 bg-gradient-primary hover:opacity-90"
                  onClick={() => setExtendedDetailsOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Legg til utvidede detaljer
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="px-8 py-4 bg-gradient-primary hover:opacity-90"
                  onClick={() => {
                    // Redirect to pricing or show upgrade modal
                    console.log('Show upgrade modal');
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Utvid fullstendig bankrapport
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {isPro ? 'Finansiering • Risikovurdering • Dokumentopplasting' : 'Alle analysemoduler • ⚡ Pro-abonnement'}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="library">
            <CalculationLibrary 
              onLoadCalculation={handleLoadCalculation}
              onSaveCurrentCalculation={() => setSaveDialogOpen(true)}
              currentCalculationData={canShowResults ? calculatorData : null}
            />
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
        
        <ExtendedDetailsDialog
          open={extendedDetailsOpen}
          onOpenChange={setExtendedDetailsOpen}
        />
      </div>
    </>
  );
};

export default Calculator;