import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoanCalculator } from '@/hooks/useLoanCalculator';
import { formatNumberWithSpaces } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';
import { AlertCircle, Plus, Trash2, TrendingUp, Wallet, Calculator as CalcIcon, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const LoanCalculator = () => {
  const { user } = useAuth();
  const {
    loading,
    equityData,
    scenarios,
    availableEquity,
    equityFromPropertyGains,
    propertyEquityDetails,
    saveEquityData,
    saveScenario,
    deleteScenario,
    validateEquityAllocation,
    calculateLoanPayment,
  } = useLoanCalculator();

  // Equity setup form
  const [totalEquity, setTotalEquity] = useState(equityData?.total_equity?.toString() || '');
  const [equityNotes, setEquityNotes] = useState(equityData?.notes || '');
  const [defaultInterestRate, setDefaultInterestRate] = useState(equityData?.default_interest_rate?.toString() || '4.5');
  const [defaultLoanPeriod, setDefaultLoanPeriod] = useState(equityData?.default_loan_period_years || 30);
  const [defaultEquityPercentage, setDefaultEquityPercentage] = useState(equityData?.default_equity_percentage?.toString() || '20');

  // New scenario form
  const [showScenarioDialog, setShowScenarioDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [equityAllocated, setEquityAllocated] = useState('');
  const [interestRate, setInterestRate] = useState('4.5');
  const [loanPeriod, setLoanPeriod] = useState(30);
  const [additionalFunding, setAdditionalFunding] = useState('');
  const [fundingSource, setFundingSource] = useState('');

  // Calculated values
  const loanAmount = Number(propertyValue) - Number(equityAllocated) - Number(additionalFunding || 0);
  const monthlyPayment = loanAmount > 0 ? calculateLoanPayment(loanAmount, Number(interestRate), loanPeriod) : 0;
  const loanToValue = Number(propertyValue) > 0 ? (loanAmount / Number(propertyValue)) * 100 : 0;

  const handleSaveEquity = async () => {
    await saveEquityData(
      Number(totalEquity), 
      equityNotes,
      Number(defaultInterestRate),
      defaultLoanPeriod,
      Number(defaultEquityPercentage)
    );
  };

  const handleSaveScenario = async () => {
    const validation = validateEquityAllocation(Number(equityAllocated));
    
    if (!validation.valid && !additionalFunding) {
      return; // Validation error already shown by validateEquityAllocation
    }

    const success = await saveScenario({
      scenario_name: scenarioName,
      property_address: propertyAddress,
      property_value: Number(propertyValue),
      equity_allocated: Number(equityAllocated),
      loan_amount: loanAmount,
      interest_rate: Number(interestRate),
      loan_period_years: loanPeriod,
      additional_funding_source: fundingSource || undefined,
      additional_funding_amount: Number(additionalFunding) || undefined,
    });

    if (success) {
      setShowScenarioDialog(false);
      resetScenarioForm();
    }
  };

  const resetScenarioForm = () => {
    setScenarioName('');
    setPropertyAddress('');
    setPropertyValue('');
    setEquityAllocated('');
    setInterestRate('4.5');
    setLoanPeriod(30);
    setAdditionalFunding('');
    setFundingSource('');
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Du må være logget inn for å bruke lånekalkulatoren
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Lånekalkulator
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Administrer din egenkapital og planlegg lånescenarier for fremtidige eiendomskjøp
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="equity">Egenkapital</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarier</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Egenkapital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {equityData ? `${formatNumberWithSpaces(equityData.total_equity)} kr` : 'Ikke satt'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Manuell innstilling</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tilgjengelig Egenkapital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatNumberWithSpaces(equityFromPropertyGains)} kr
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fra eiendomsverdiøkning
                </p>
                {propertyEquityDetails.length > 0 && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {propertyEquityDetails.map((detail) => (
                      <div key={detail.property_id} className="text-xs text-muted-foreground">
                        {detail.address}: +{formatNumberWithSpaces(detail.equity_gain)} kr
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bundne Scenarier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {scenarios.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Alert */}
          <Alert className="max-w-4xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Lånekalkulatoren hjelper deg å administrere egenkapitalen din og planlegge lånescenarier for fremtidige eiendomskjøp. 
              Start med å sette opp din totale egenkapital under "Egenkapital"-fanen.
            </AlertDescription>
          </Alert>

          {/* Scenarios List */}
          {scenarios.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-4">
              <h3 className="text-xl font-semibold">Aktive Scenarier</h3>
              {scenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{scenario.scenario_name}</CardTitle>
                        <CardDescription>{scenario.property_address}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Boligverdi:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.property_value)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Egenkapital:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.equity_allocated)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lånebeløp:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.loan_amount)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Månedsrate:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.monthly_payment || 0)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Belåningsgrad:</span>
                        <span className="ml-2 font-medium">{(scenario.loan_to_value || 0).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rente:</span>
                        <span className="ml-2 font-medium">{scenario.interest_rate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Equity Tab */}
        <TabsContent value="equity" className="space-y-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Egenkapitaladministrasjon</CardTitle>
              <CardDescription>
                Legg inn din totale egenkapital én gang. Systemet beregner automatisk tilgjengelig kapital basert på dine lånescenarier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="totalEquity">Total Egenkapital (kr)</Label>
                <CurrencyInput
                  id="totalEquity"
                  value={totalEquity}
                  onChange={(value) => setTotalEquity(value)}
                  placeholder="3 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equityNotes">Notater (valgfritt)</Label>
                <Textarea
                  id="equityNotes"
                  value={equityNotes}
                  onChange={(e) => setEquityNotes(e.target.value)}
                  placeholder="Legg til notater om din egenkapital..."
                  rows={3}
                />
              </div>

              {/* Default Loan Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-foreground">Standardverdier for lån</h4>
                <p className="text-sm text-muted-foreground">
                  Disse verdiene brukes automatisk når du fyller ut kalkulatoren
                </p>

                <div className="space-y-2">
                  <Label htmlFor="defaultInterestRate">Standard rente (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="defaultInterestRate"
                      min={1}
                      max={10}
                      step={0.1}
                      value={[Number(defaultInterestRate)]}
                      onValueChange={([value]) => setDefaultInterestRate(value.toString())}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={defaultInterestRate}
                      onChange={(e) => setDefaultInterestRate(e.target.value)}
                      className="w-20"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLoanPeriod">Standard låneperiode (år)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="defaultLoanPeriod"
                      min={5}
                      max={35}
                      step={5}
                      value={[defaultLoanPeriod]}
                      onValueChange={([value]) => setDefaultLoanPeriod(value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={defaultLoanPeriod}
                      onChange={(e) => setDefaultLoanPeriod(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultEquityPercentage">Standard egenkapital (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="defaultEquityPercentage"
                      min={10}
                      max={50}
                      step={5}
                      value={[Number(defaultEquityPercentage)]}
                      onValueChange={([value]) => setDefaultEquityPercentage(value.toString())}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={defaultEquityPercentage}
                      onChange={(e) => setDefaultEquityPercentage(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Brukes til å beregne lånebeløp automatisk (totalpris - {defaultEquityPercentage}%)
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveEquity} disabled={loading || !totalEquity} className="w-full">
                Lagre Egenkapital
              </Button>

              {equityData && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Tilgjengelig egenkapital: <strong>{formatNumberWithSpaces(availableEquity)} kr</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="flex justify-end max-w-4xl mx-auto">
            <Dialog open={showScenarioDialog} onOpenChange={setShowScenarioDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nytt Scenario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Opprett Nytt Lånescenario</DialogTitle>
                  <DialogDescription>
                    Beregn og lagre et nytt lånescenario for eiendomskjøp
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scenarioName">Scenarionavn</Label>
                      <Input
                        id="scenarioName"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        placeholder="Leilighet i Oslo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="propertyAddress">Eiendomsadresse</Label>
                      <Input
                        id="propertyAddress"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        placeholder="Storgata 1, 0155 Oslo"
                      />
                    </div>
                  </div>

                  {/* Property Value */}
                  <div className="space-y-2">
                    <Label htmlFor="propertyValue">Boligverdi (kr)</Label>
                    <CurrencyInput
                      id="propertyValue"
                      value={propertyValue}
                      onChange={(value) => setPropertyValue(value)}
                      placeholder="5 000 000"
                    />
                  </div>

                  {/* Equity Allocation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="equityAllocated">Egenkapital (kr)</Label>
                      <span className="text-sm text-muted-foreground">
                        Tilgjengelig: {formatNumberWithSpaces(availableEquity)} kr
                      </span>
                    </div>
                    <CurrencyInput
                      id="equityAllocated"
                      value={equityAllocated}
                      onChange={(value) => setEquityAllocated(value)}
                      placeholder="1 000 000"
                    />
                    {Number(equityAllocated) > availableEquity && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Du overskrider tilgjengelig egenkapital. Vennligst spesifiser ekstra finansieringskilde.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Additional Funding (if needed) */}
                  {Number(equityAllocated) > availableEquity && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Ekstra Finansiering</h4>
                      <div className="space-y-2">
                        <Label htmlFor="additionalFunding">Ekstra beløp (kr)</Label>
                        <CurrencyInput
                          id="additionalFunding"
                          value={additionalFunding}
                          onChange={(value) => setAdditionalFunding(value)}
                          placeholder="500 000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fundingSource">Kilde</Label>
                        <Input
                          id="fundingSource"
                          value={fundingSource}
                          onChange={(e) => setFundingSource(e.target.value)}
                          placeholder="Arv, gave, salg av aktiva, osv."
                        />
                      </div>
                    </div>
                  )}

                  {/* Loan Terms */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Rente (%)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="interestRate"
                          min={1}
                          max={10}
                          step={0.1}
                          value={[Number(interestRate)]}
                          onValueChange={([value]) => setInterestRate(value.toString())}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          className="w-20"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loanPeriod">Nedbetalingstid (år)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="loanPeriod"
                          min={5}
                          max={35}
                          step={5}
                          value={[loanPeriod]}
                          onValueChange={([value]) => setLoanPeriod(value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={loanPeriod}
                          onChange={(e) => setLoanPeriod(Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations Summary */}
                  {loanAmount > 0 && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CalcIcon className="h-5 w-5" />
                          Beregninger
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lånebeløp:</span>
                          <span className="font-medium">{formatNumberWithSpaces(loanAmount)} kr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Månedsrate:</span>
                          <span className="font-medium">{formatNumberWithSpaces(monthlyPayment)} kr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Belåningsgrad:</span>
                          <span className="font-medium">{loanToValue.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Totale rentekostnader:</span>
                          <span className="font-medium">
                            {formatNumberWithSpaces((monthlyPayment * loanPeriod * 12) - loanAmount)} kr
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleSaveScenario}
                    disabled={loading || !scenarioName || !propertyValue || !equityAllocated}
                    className="w-full"
                  >
                    Lagre Scenario
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Scenarios list (reuse from overview) */}
          {scenarios.length === 0 ? (
            <Card className="max-w-4xl mx-auto">
              <CardContent className="py-12 text-center">
                <CalcIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen scenarier ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Opprett ditt første lånescenario for å komme i gang
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {scenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{scenario.scenario_name}</CardTitle>
                        <CardDescription>{scenario.property_address}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Boligverdi:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.property_value)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Egenkapital:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.equity_allocated)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lånebeløp:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.loan_amount)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Månedsrate:</span>
                        <span className="ml-2 font-medium">{formatNumberWithSpaces(scenario.monthly_payment || 0)} kr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Belåningsgrad:</span>
                        <span className="ml-2 font-medium">{(scenario.loan_to_value || 0).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rente:</span>
                        <span className="ml-2 font-medium">{scenario.interest_rate}%</span>
                      </div>
                    </div>
                    {scenario.additional_funding_amount && (
                      <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Ekstra finansiering: {formatNumberWithSpaces(scenario.additional_funding_amount)} kr
                          {scenario.additional_funding_source && ` (${scenario.additional_funding_source})`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
