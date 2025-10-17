import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator as CalcIcon, CheckCircle2, FileText, Ruler, Library, Plus, Wallet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingPlannerImproved from '@/components/BuildingPlannerImproved';
import CalculationLibrary from '@/components/CalculationLibrary';
import { useCalculatorData } from '@/hooks/useCalculatorData';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { ExtendedDetailsDialog } from '@/components/ExtendedDetailsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscription } from '@/hooks/useSubscription';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';
import { FinnPropertyData } from '@/types/finn';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { CalculatorChat } from '@/components/calculator/CalculatorChat';
import { CalculatorPDFPreview } from '@/components/calculator/CalculatorPDFPreview';
import { BoligkalkyleSimulator } from '@/components/calculator/BoligkalkyleSimulator';
import { ResizableSplitView } from '@/components/calculator/ResizableSplitView';

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
  const { hasCredits, credits } = useCredits();
  const { toast } = useToast();
  const { saveCalculation } = useCalculationHistory();
  const { equityData } = useLoanCalculator(); // Get default loan settings

  // States for save dialog
  const [extendedDetailsOpen, setExtendedDetailsOpen] = useState(false);
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
  const [mobileView, setMobileView] = useState<'chat' | 'spreadsheet'>('chat');
  const isMobile = useIsMobile();
  
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
    
    // Also update the address in calculator data
    handleInputChange('address', data.address);
    
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
    
    // Auto-fill estimated costs if available
    if (data.estimates) {
      if (data.estimates.monthlyRent && !manualOverride.expectedAnnualRent) {
        handleInputChange('isRental', true);
        handleInputChange('expectedAnnualRent', (data.estimates.monthlyRent * 12).toString());
      }
      if (data.estimates.electricityCost && !manualOverride.electricityMonthly) {
        handleInputChange('electricityMonthly', data.estimates.electricityCost.toString());
      }
      if (data.estimates.insurance && !manualOverride.insurance) {
        handleInputChange('insurance', data.estimates.insurance.toString());
      }
      if (data.estimates.maintenance && !manualOverride.maintenance) {
        handleInputChange('maintenance', data.estimates.maintenance.toString());
      }
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
      title: "✨ Komplett analyse klar!",
      description: `Eiendomsdata, estimert leiepris, og alle kostnader er automatisk beregnet. Du kan fortsatt redigere verdiene.`,
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

    // Get address from calculator data (which is updated by both Finn fetch and manual input)
    const address = data.address || propertyAddress || '';
    
    // Auto-generate calculation name from address or use default
    const autoCalculationName = address || `Kalkulasjon ${new Date().toLocaleDateString('no-NO')}`;

    // Prepare calculation data
    const calculationData = {
      ...data,
      finnCode: finnCode || null,
      propertyAddress: address || null
    };

    // Prepare results data
    const resultsData = {
      totalPrice: parseFloat(data.totalPrice) || 0,
      monthlyRent: data.isRental ? parseFloat(data.expectedAnnualRent) / 12 || 0 : 0,
      yield: data.isRental && parseFloat(data.totalPrice) > 0 
        ? (parseFloat(data.expectedAnnualRent) / parseFloat(data.totalPrice) * 100) 
        : 0,
      monthlyCashFlow: data.isRental 
        ? parseFloat(data.expectedAnnualRent) / 12 - totalExpenses - monthlyLoanPayment 
        : -totalExpenses - monthlyLoanPayment,
      monthlyLoanPayment,
      totalExpenses,
      isRental: data.isRental
    };

    await saveCalculation(
      autoCalculationName,
      finnCode || null,
      address || null,
      calculationData,
      resultsData
    );
  };

  const handleLoadCalculation = (calculation: any) => {
    // Load the calculation data into the form
    const loadedData = calculation.calculation_data;
    Object.keys(loadedData).forEach(key => {
      if (key === 'finnCode') {
        setFinnCode(loadedData[key] || '');
      } else if (key === 'propertyAddress') {
        setPropertyAddress(loadedData[key] || '');
      } else {
        updateField(key, loadedData[key]);
      }
    });

    // Switch to calculator tab automatically
    setActiveTab('calculator');

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
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <CalcIcon className="h-10 w-10 text-primary" />
              Eiendomskalkulator
            </h1>
            {hasCredits && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {credits} {credits === 1 ? 'kreditt' : 'kreditter'}
              </Badge>
            )}
          </div>
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
          
          <TabsContent value="calculator" className="mt-6">
            {user ? (
              <>
                {/* Desktop: Split view */}
                {!isMobile && (
                  <div className="h-[calc(100vh-12rem)]">
                    <ResizableSplitView
                      defaultLeftWidth={40}
                      left={
                        <CalculatorChat 
                          calculatorData={data}
                          onDataUpdate={(field, value) => updateField(field, value)}
                          hasCredits={isPro || isAdmin || hasCredits}
                        />
                      }
                      right={
                        <BoligkalkyleSimulator 
                          data={data}
                          onDataChange={(field, value) => updateField(field, value)}
                        />
                      }
                    />
                  </div>
                )}

                {/* Mobile: Tab-based view with slider */}
                {isMobile && (
                  <div className="flex flex-col h-[calc(100vh-12rem)]">
                    {/* Content area */}
                    <div className="flex-1 overflow-hidden">
                      {mobileView === 'chat' ? (
                        <CalculatorChat 
                          calculatorData={data}
                          onDataUpdate={(field, value) => updateField(field, value)}
                          hasCredits={isPro || isAdmin || hasCredits}
                        />
                      ) : (
                        <BoligkalkyleSimulator 
                          data={data}
                          onDataChange={(field, value) => updateField(field, value)}
                        />
                      )}
                    </div>

                    {/* Bottom slider/tab bar */}
                    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <div className="flex">
                        <button
                          onClick={() => setMobileView('chat')}
                          className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                            mobileView === 'chat'
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Chat & Inndata
                        </button>
                        <button
                          onClick={() => setMobileView('spreadsheet')}
                          className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                            mobileView === 'spreadsheet'
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Kalkyle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Logg inn for å bruke kalkulatoren</h3>
                <p className="text-muted-foreground mb-4">
                  Du må være innlogget for å bruke AI-assistert kalkulator og fylle ut boligfinansieringsrapporten.
                </p>
                <Button onClick={() => navigate('/auth')}>
                  Logg inn
                </Button>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="library">
            <CalculationLibrary 
              onLoadCalculation={handleLoadCalculation}
              currentCalculationData={canShowResults ? data : null}
            />
          </TabsContent>
          
          <TabsContent value="building-planner">
            {canAccessBuildingPlanner ? (
              <BuildingPlannerImproved />
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