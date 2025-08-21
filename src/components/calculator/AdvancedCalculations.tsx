import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState, useMemo } from "react";
import { TrendingUp, Calculator, AlertTriangle, DollarSign, Target, BarChart3 } from "lucide-react";

interface AdvancedCalculationsProps {
  propertyValue: number;
  monthlyRent: number;
  expenses: number;
  loanAmount: number;
  interestRate: number;
  loanPeriod: number;
}

const AdvancedCalculations = ({
  propertyValue,
  monthlyRent,
  expenses,
  loanAmount,
  interestRate,
  loanPeriod
}: AdvancedCalculationsProps) => {
  // State for advanced parameters
  const [taxRate, setTaxRate] = useState(22);
  const [appreciation, setAppreciation] = useState(3);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [maintenanceReserve, setMaintenanceReserve] = useState(2);
  const [kpiInflation, setKpiInflation] = useState(3);
  const [capExYears, setCapExYears] = useState([3, 7]);
  const [capExAmounts, setCapExAmounts] = useState([200000, 300000]);
  const [interestOnlyPeriod, setInterestOnlyPeriod] = useState(0);
  const [refinanceYear, setRefinanceYear] = useState(0);
  const [newInterestRate, setNewInterestRate] = useState(interestRate);
  
  // Cost structure
  const [fixedCosts, setFixedCosts] = useState(expenses * 0.6);
  const [variableCosts, setVariableCosts] = useState(expenses * 0.4);

  // Advanced calculations
  const monthlyInterest = interestRate / 100 / 12;
  const numberOfPayments = loanPeriod * 12;
  
  // Calculate 10-year cash flow projections
  const cashFlowProjections = useMemo(() => {
    const projections = [];
    let currentRent = monthlyRent;
    let currentPropertyValue = propertyValue;
    let remainingLoan = loanAmount;
    
    for (let year = 1; year <= 10; year++) {
      // Apply KPI inflation to rent
      currentRent = currentRent * (1 + kpiInflation / 100);
      
      // Apply property value appreciation
      currentPropertyValue = currentPropertyValue * (1 + appreciation / 100);
      
      // Calculate effective rent (after vacancy)
      const effectiveAnnualRent = currentRent * 12 * (1 - vacancyRate / 100);
      
      // Calculate annual operating costs
      const annualFixedCosts = fixedCosts * 12;
      const annualVariableCosts = variableCosts * 12 * (1 + kpiInflation / 100);
      const annualMaintenanceCosts = currentPropertyValue * (maintenanceReserve / 100);
      
      // Check for CapEx this year
      const capExIndex = capExYears.findIndex(capYear => capYear === year);
      const capExThisYear = capExIndex !== -1 ? capExAmounts[capExIndex] : 0;
      
      // Calculate loan payments
      let annualLoanPayment = 0;
      let interestPayment = 0;
      let principalPayment = 0;
      
      if (remainingLoan > 0) {
        const currentRate = (year >= refinanceYear && refinanceYear > 0) ? newInterestRate : interestRate;
        const monthlyRate = currentRate / 100 / 12;
        
        if (year <= interestOnlyPeriod) {
          interestPayment = remainingLoan * (currentRate / 100);
          principalPayment = 0;
        } else {
          const remainingPeriods = (loanPeriod - year + 1) * 12;
          if (remainingPeriods > 0) {
            const monthlyPayment = remainingLoan * 
              (monthlyRate * Math.pow(1 + monthlyRate, remainingPeriods)) / 
              (Math.pow(1 + monthlyRate, remainingPeriods) - 1);
            
            annualLoanPayment = monthlyPayment * 12;
            interestPayment = remainingLoan * (currentRate / 100);
            principalPayment = annualLoanPayment - interestPayment;
          }
        }
        
        remainingLoan = Math.max(0, remainingLoan - principalPayment);
      }
      
      // Calculate NOI and cash flow
      const noi = effectiveAnnualRent - annualFixedCosts - annualVariableCosts - annualMaintenanceCosts;
      const beforeTaxCashFlow = noi - annualLoanPayment - capExThisYear;
      const taxableIncome = Math.max(0, noi - interestPayment);
      const taxes = taxableIncome * (taxRate / 100);
      const afterTaxCashFlow = beforeTaxCashFlow - taxes;
      
      // Calculate DSCR
      const dscr = annualLoanPayment > 0 ? noi / annualLoanPayment : 0;
      
      projections.push({
        year,
        currentRent: currentRent,
        effectiveAnnualRent,
        noi,
        annualLoanPayment,
        interestPayment,
        principalPayment,
        remainingLoan,
        capExThisYear,
        beforeTaxCashFlow,
        afterTaxCashFlow,
        dscr,
        currentPropertyValue,
        taxes
      });
    }
    
    return projections;
  }, [monthlyRent, propertyValue, loanAmount, interestRate, loanPeriod, kpiInflation, appreciation, vacancyRate, fixedCosts, variableCosts, maintenanceReserve, capExYears, capExAmounts, taxRate, interestOnlyPeriod, refinanceYear, newInterestRate]);

  // Break-even analysis
  const breakEvenAnalysis = useMemo(() => {
    const annualFixedCosts = fixedCosts * 12;
    const annualVariableCosts = variableCosts * 12;
    const annualMaintenanceCosts = propertyValue * (maintenanceReserve / 100);
    const annualLoanPayment = cashFlowProjections[0]?.annualLoanPayment || 0;
    
    const totalAnnualCosts = annualFixedCosts + annualVariableCosts + annualMaintenanceCosts + annualLoanPayment;
    
    // Break-even rent (monthly)
    const breakEvenRent = totalAnnualCosts / 12;
    
    // Break-even occupancy
    const breakEvenOccupancy = (totalAnnualCosts / (monthlyRent * 12)) * 100;
    
    // Break-even interest rate
    const noi = (monthlyRent * 12 * (1 - vacancyRate / 100)) - annualFixedCosts - annualVariableCosts - annualMaintenanceCosts;
    const breakEvenRate = loanAmount > 0 ? (noi / loanAmount) * 100 : 0;
    
    return {
      breakEvenRent,
      breakEvenOccupancy,
      breakEvenRate
    };
  }, [monthlyRent, propertyValue, loanAmount, fixedCosts, variableCosts, maintenanceReserve, vacancyRate, cashFlowProjections]);

  // Loan alternatives comparison
  const loanAlternatives = useMemo(() => {
    const alternatives = [
      { name: "Nåværende", rate: interestRate, margin: 2.5, ltv: (loanAmount / propertyValue) * 100 },
      { name: "Bank A", rate: interestRate + 0.5, margin: 3.0, ltv: 85 },
      { name: "Bank B", rate: interestRate - 0.2, margin: 2.2, ltv: 80 },
      { name: "Bank C", rate: interestRate + 0.3, margin: 2.8, ltv: 90 }
    ];

    return alternatives.map(alt => {
      const altLoanAmount = propertyValue * (alt.ltv / 100);
      const monthlyRate = alt.rate / 100 / 12;
      const monthlyPayment = altLoanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      const noi = (monthlyRent * 12 * (1 - vacancyRate / 100)) - (fixedCosts + variableCosts) * 12 - propertyValue * (maintenanceReserve / 100);
      const annualLoanPayment = monthlyPayment * 12;
      const dscr = annualLoanPayment > 0 ? noi / annualLoanPayment : 0;
      
      // Traffic light system for covenant probability
      const dscrTrafficLight = dscr >= 1.5 ? 'green' : dscr >= 1.2 ? 'yellow' : 'red';
      
      return {
        ...alt,
        loanAmount: altLoanAmount,
        monthlyPayment,
        annualPayment: annualLoanPayment,
        dscr,
        dscrTrafficLight,
        totalInterest: (monthlyPayment * numberOfPayments) - altLoanAmount
      };
    });
  }, [interestRate, loanAmount, propertyValue, monthlyRent, vacancyRate, fixedCosts, variableCosts, maintenanceReserve, numberOfPayments]);

  const currentYear = new Date().getFullYear();

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Avanserte Beregninger
        </CardTitle>
        <CardDescription>
          10-års kontantstrøm, amortisering, break-even analyse og lånealternativer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="cashflow" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="cashflow">Kontantstrøm</TabsTrigger>
            <TabsTrigger value="amortization">Lån & DSCR</TabsTrigger>
            <TabsTrigger value="breakeven">Break-even</TabsTrigger>
            <TabsTrigger value="alternatives">Alternativer</TabsTrigger>
          </TabsList>

          {/* Cash Flow Tab */}
          <TabsContent value="cashflow" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">10-års Kontantstrøm Analyse</h3>
              
              {/* Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="kpi-inflation">KPI-regulering (%)</Label>
                  <Input
                    id="kpi-inflation"
                    type="number"
                    step="0.1"
                    value={kpiInflation}
                    onChange={(e) => setKpiInflation(parseFloat(e.target.value) || 2)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Standard: 2%</p>
                </div>
                <div>
                  <Label htmlFor="appreciation">Verdiøkning (%)</Label>
                  <Input
                    id="appreciation"
                    type="number"
                    step="0.1"
                    value={appreciation}
                    onChange={(e) => setAppreciation(parseFloat(e.target.value) || 3)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Standard: 3%</p>
                </div>
                <div>
                  <Label htmlFor="vacancy-rate">Leieledie (%)</Label>
                  <Input
                    id="vacancy-rate"
                    type="number"
                    step="0.1"
                    value={vacancyRate}
                    onChange={(e) => setVacancyRate(parseFloat(e.target.value) || 5)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Standard: 5% per år</p>
                </div>
                <div>
                  <Label htmlFor="tax-rate">Skattesats (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 22)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Standard: 22%</p>
                </div>
              </div>

              {/* CapEx Planning */}
              <div className="p-4 bg-card-elevated rounded-lg">
                <h4 className="font-semibold mb-3">CapEx-plan (Større vedlikehold/oppgraderinger)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Planlegg større investeringer som nye kjøkken, bad, eller andre oppgraderinger
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CapEx år (kommaseparert)</Label>
                    <Input
                      placeholder="3, 7"
                      value={capExYears.join(', ')}
                      onChange={(e) => setCapExYears(e.target.value.split(',').map(v => parseInt(v.trim())).filter(Boolean))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Eksempel: År 3 (kjøkken), År 7 (bad)
                    </p>
                  </div>
                  <div>
                    <Label>CapEx beløp (kommaseparert)</Label>
                    <Input
                      placeholder="50000, 100000"
                      value={capExAmounts.join(', ')}
                      onChange={(e) => setCapExAmounts(e.target.value.split(',').map(v => parseInt(v.trim())).filter(Boolean))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Beløp i kroner for hvert CapEx-år
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Flow Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kontantstrøm over 10 år</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cashFlowProjections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                         formatter={(value, name) => [
                           `${Math.round(value as number).toLocaleString()} kr`, 
                           name === 'beforeTaxCashFlow' ? 'Før skatt' : 'Etter skatt'
                         ]}
                        labelFormatter={(label) => `År ${label}`}
                      />
                      <Line type="monotone" dataKey="beforeTaxCashFlow" stroke="#10b981" strokeWidth={2} name="beforeTaxCashFlow" />
                      <Line type="monotone" dataKey="afterTaxCashFlow" stroke="#3b82f6" strokeWidth={2} name="afterTaxCashFlow" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Break-even Summary */}
              <div className="bg-primary-soft p-4 rounded-lg mt-4">
                <h5 className="font-semibold text-foreground mb-2">📊 Break-even Analyse:</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Leie (månedlig):</p>
                    <p className="font-semibold text-primary">{breakEvenAnalysis.breakEvenRent.toLocaleString()} kr</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rente (maks uten negativ CF):</p>
                    <p className="font-semibold text-accent">{Math.min(breakEvenAnalysis.breakEvenRate, 15).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Beleggsprosent (minimum):</p>
                    <p className="font-semibold text-secondary">{Math.max(100 - breakEvenAnalysis.breakEvenOccupancy, 0).toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              {/* Cash Flow Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detaljert Kontantstrøm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>År</TableHead>
                          <TableHead>Effektiv leie</TableHead>
                          <TableHead>NOI</TableHead>
                          <TableHead>Lånebetalinger</TableHead>
                          <TableHead>CapEx</TableHead>
                          <TableHead>Før skatt</TableHead>
                          <TableHead>Etter skatt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlowProjections.map((projection) => (
                          <TableRow key={projection.year}>
                            <TableCell>{currentYear + projection.year}</TableCell>
                            <TableCell>{Math.round(projection.effectiveAnnualRent).toLocaleString()}</TableCell>
                            <TableCell className="text-primary">{Math.round(projection.noi).toLocaleString()}</TableCell>
                            <TableCell>{Math.round(projection.annualLoanPayment).toLocaleString()}</TableCell>
                            <TableCell className={projection.capExThisYear > 0 ? 'text-destructive' : ''}>
                              {projection.capExThisYear > 0 ? projection.capExThisYear.toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className={projection.beforeTaxCashFlow >= 0 ? 'text-primary' : 'text-destructive'}>
                              {Math.round(projection.beforeTaxCashFlow).toLocaleString()}
                            </TableCell>
                            <TableCell className={projection.afterTaxCashFlow >= 0 ? 'text-primary' : 'text-destructive'}>
                              {Math.round(projection.afterTaxCashFlow).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Amortization Tab */}
          <TabsContent value="amortization" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Amortisering & DSCR Analyse</h3>
              
              {/* Loan Parameters */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="interest-only">Avdragsfri periode (år)</Label>
                  <Input
                    id="interest-only"
                    type="number"
                    min="0"
                    max="5"
                    value={interestOnlyPeriod}
                    onChange={(e) => setInterestOnlyPeriod(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="refinance-year">Refinansiering år</Label>
                  <Input
                    id="refinance-year"
                    type="number"
                    min="0"
                    max="10"
                    value={refinanceYear}
                    onChange={(e) => setRefinanceYear(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-rate">Ny rente (%)</Label>
                  <Input
                    id="new-rate"
                    type="number"
                    step="0.1"
                    value={newInterestRate}
                    onChange={(e) => setNewInterestRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* DSCR Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">DSCR-kurve over tid</CardTitle>
                  <CardDescription>Debt Service Coverage Ratio (NOI / Årlig lånebetalinger)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cashFlowProjections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [parseFloat(value as string).toFixed(2), 'DSCR']}
                        labelFormatter={(label) => `År ${label}`}
                      />
                      <Line type="monotone" dataKey="dscr" stroke="#f59e0b" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-xs text-muted-foreground">
                    DSCR over 1.2 regnes som akseptabelt av de fleste banker
                  </div>
                </CardContent>
              </Card>

              {/* Amortization Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Amortiseringstabell</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>År</TableHead>
                          <TableHead>Rentebetaling</TableHead>
                          <TableHead>Avdrag</TableHead>
                          <TableHead>Restgjeld</TableHead>
                          <TableHead>DSCR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlowProjections.map((projection) => (
                          <TableRow key={projection.year}>
                            <TableCell>{currentYear + projection.year}</TableCell>
                            <TableCell>{Math.round(projection.interestPayment).toLocaleString()}</TableCell>
                            <TableCell>{Math.round(projection.principalPayment).toLocaleString()}</TableCell>
                            <TableCell className="font-semibold">{Math.round(projection.remainingLoan).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={
                                  projection.dscr >= 1.5 ? 'text-green-600 font-semibold' : 
                                  projection.dscr >= 1.2 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'
                                }>
                                  {projection.dscr.toFixed(2)}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${
                                  projection.dscr >= 1.5 ? 'bg-green-500' : 
                                  projection.dscr >= 1.2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Break-even Tab */}
          <TabsContent value="breakeven" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Break-even Analyse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Break-even Leie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {Math.round(breakEvenAnalysis.breakEvenRent).toLocaleString()} kr
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Månedlig leie for null-resultat
                    </p>
                    <div className="mt-2 text-xs">
                      Nåværende: {monthlyRent.toLocaleString()} kr
                      <span className={`ml-2 ${monthlyRent > breakEvenAnalysis.breakEvenRent ? 'text-green-600' : 'text-red-600'}`}>
                        ({monthlyRent > breakEvenAnalysis.breakEvenRent ? '+' : ''}{((monthlyRent - breakEvenAnalysis.breakEvenRent) / breakEvenAnalysis.breakEvenRent * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-accent/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      Break-even Rente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent mb-1">
                      {breakEvenAnalysis.breakEvenRate.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Maksimal rente for null-resultat
                    </p>
                    <div className="mt-2 text-xs">
                      Nåværende: {interestRate.toFixed(2)}%
                      <span className={`ml-2 ${interestRate < breakEvenAnalysis.breakEvenRate ? 'text-green-600' : 'text-red-600'}`}>
                        ({interestRate < breakEvenAnalysis.breakEvenRate ? 'Headroom' : 'Over grense'})
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      Break-even Belegg
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {breakEvenAnalysis.breakEvenOccupancy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minimum beleggsprosent
                    </p>
                    <div className="mt-2 text-xs">
                      Antatt: {(100 - vacancyRate).toFixed(1)}%
                      <span className={`ml-2 ${(100 - vacancyRate) > breakEvenAnalysis.breakEvenOccupancy ? 'text-green-600' : 'text-red-600'}`}>
                        ({(100 - vacancyRate) > breakEvenAnalysis.breakEvenOccupancy ? 'Sikker margin' : 'Risiko'})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sensitivity Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sensitivitetsanalyse</CardTitle>
                  <CardDescription>Hvordan endringer påvirker kontantstrøm</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Leie +10%', impact: (monthlyRent * 0.1 * 12) },
                      { label: 'Leie -10%', impact: (monthlyRent * -0.1 * 12) },
                      { label: 'Rente +1%', impact: -(loanAmount * 0.01) },
                      { label: 'Kostnader +20%', impact: -((fixedCosts + variableCosts) * 12 * 0.2) },
                    ].map((item, index) => (
                      <div key={index} className="p-3 bg-muted rounded">
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                        <div className={`font-semibold ${item.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.impact >= 0 ? '+' : ''}{Math.round(item.impact).toLocaleString()} kr
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Loan Alternatives Tab */}
          <TabsContent value="alternatives" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Sammenligning av Lånealternativer</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lånealternativer med DSCR-vurdering</CardTitle>
                  <CardDescription>Sammenlign renter, betalinger og covenant-headroom</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bank</TableHead>
                          <TableHead>Rente</TableHead>
                          <TableHead>Margin</TableHead>
                          <TableHead>LTV</TableHead>
                          <TableHead>DSCR</TableHead>
                          <TableHead>Covenant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loanAlternatives.map((alt, index) => (
                          <TableRow key={index} className={index === 0 ? 'bg-primary/5' : ''}>
                            <TableCell className="font-semibold">
                              {alt.name}
                              {index === 0 && <Badge className="ml-2" variant="outline">Nåværende</Badge>}
                            </TableCell>
                            <TableCell>{alt.rate.toFixed(2)}%</TableCell>
                            <TableCell>{alt.margin.toFixed(1)}%</TableCell>
                            <TableCell>{alt.ltv.toFixed(0)}%</TableCell>
                            <TableCell className={`font-semibold ${
                              alt.dscr >= 1.5 ? 'text-green-600' : 
                              alt.dscr >= 1.2 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {alt.dscr.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className={`w-4 h-4 rounded-full ${
                                alt.dscrTrafficLight === 'green' ? 'bg-green-500' : 
                                alt.dscrTrafficLight === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>DSCR ≥ 1.5 (Sikker)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>DSCR 1.2-1.5 (Akseptabel)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>DSCR &lt; 1.2 (Risikabel)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedCalculations;