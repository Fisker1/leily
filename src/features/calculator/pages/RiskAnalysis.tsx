import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/shared/components/Navigation";
import { 
  AlertTriangle, 
  Shield, 
  TrendingDown,
  ArrowLeft,
  Calculator,
  FileText 
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const RiskAnalysis = () => {
  const [propertyValue, setPropertyValue] = useState("2500000");
  const [monthlyRent, setMonthlyRent] = useState("18000");
  const [loanAmount, setLoanAmount] = useState("2000000");
  const [currentInterestRate, setCurrentInterestRate] = useState("4.5");
  const [interestRateRisk, setInterestRateRisk] = useState("2");
  const [vacancyPeriod, setVacancyPeriod] = useState("3");
  const [maintenanceCost, setMaintenanceCost] = useState("50000");
  const [marketCorrection, setMarketCorrection] = useState("15");
  const [monthlyExpenses, setMonthlyExpenses] = useState("4000");

  // Risk calculations
  const loanToValue = (parseFloat(loanAmount) / parseFloat(propertyValue)) * 100;
  const monthlyLoanPayment = parseFloat(loanAmount) * (parseFloat(currentInterestRate) / 100 / 12);
  const currentCashFlow = parseFloat(monthlyRent) - parseFloat(monthlyExpenses) - monthlyLoanPayment;
  
  // Stress test scenarios
  const newInterestRate = parseFloat(currentInterestRate) + parseFloat(interestRateRisk);
  const newMonthlyPayment = parseFloat(loanAmount) * (newInterestRate / 100 / 12);
  const stressTestCashFlow = parseFloat(monthlyRent) - parseFloat(monthlyExpenses) - newMonthlyPayment;
  const vacancyLoss = parseFloat(monthlyRent) * parseFloat(vacancyPeriod);
  const stressedPropertyValue = parseFloat(propertyValue) * (1 - parseFloat(marketCorrection) / 100);
  const stressedLTV = (parseFloat(loanAmount) / stressedPropertyValue) * 100;

  const getRiskLevel = (value: number, thresholds: number[], invert: boolean = false) => {
    if (invert) {
      if (value >= thresholds[1]) return { level: "Lav", color: "text-primary", variant: "default" as const };
      if (value >= thresholds[0]) return { level: "Moderat", color: "text-yellow-600", variant: "secondary" as const };
      return { level: "Høy", color: "text-destructive", variant: "destructive" as const };
    } else {
      if (value <= thresholds[0]) return { level: "Lav", color: "text-primary", variant: "default" as const };
      if (value <= thresholds[1]) return { level: "Moderat", color: "text-yellow-600", variant: "secondary" as const };
      return { level: "Høy", color: "text-destructive", variant: "destructive" as const };
    }
  };

  const ltvRisk = getRiskLevel(loanToValue, [70, 85]);
  const cashFlowRisk = getRiskLevel(currentCashFlow, [5000, 10000], true);

  const riskScenarios = [
    {
      title: `Renteøkning til ${newInterestRate}%`,
      impact: stressTestCashFlow - currentCashFlow,
      newCashFlow: stressTestCashFlow,
      severity: stressTestCashFlow < 0 ? "Høy" : stressTestCashFlow < currentCashFlow * 0.5 ? "Moderat" : "Lav"
    },
    {
      title: `${vacancyPeriod} måneder leieledie`,
      impact: -vacancyLoss,
      newCashFlow: -parseFloat(monthlyExpenses) - monthlyLoanPayment,
      severity: vacancyLoss > Math.abs(currentCashFlow) * 3 ? "Høy" : vacancyLoss > Math.abs(currentCashFlow) ? "Moderat" : "Lav"
    },
    {
      title: `${marketCorrection}% markedskorreksjon`,
      impact: stressedPropertyValue - parseFloat(propertyValue),
      newCashFlow: currentCashFlow,
      severity: stressedLTV > 90 ? "Høy" : stressedLTV > 80 ? "Moderat" : "Lav"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/" className="text-primary hover:text-primary/80">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Risikoevaluering
              </h1>
              <p className="text-muted-foreground">Identifiser potensielle risikoer og få anbefalinger for investeringsstrategien</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Eiendomsdata</CardTitle>
                <CardDescription>Grunnleggende informasjon om eiendommen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property-value">Eiendomsverdi (kr)</Label>
                    <Input
                      id="property-value"
                      type="number"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(e.target.value)}
                    />
                  </div>
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
                    <Label htmlFor="monthly-rent">Månedlig leie (kr)</Label>
                    <Input
                      id="monthly-rent"
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthly-expenses">Månedlige utgifter (kr)</Label>
                    <Input
                      id="monthly-expenses"
                      type="number"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current-rate">Nåværende rente (%)</Label>
                    <Input
                      id="current-rate"
                      type="number"
                      step="0.1"
                      value={currentInterestRate}
                      onChange={(e) => setCurrentInterestRate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance">Årlig vedlikehold (kr)</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      value={maintenanceCost}
                      onChange={(e) => setMaintenanceCost(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Risikoscenarier</CardTitle>
                <CardDescription>Juster parametrene for stresstesting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interest-risk">Potensiell renteøkning (%)</Label>
                    <Input
                      id="interest-risk"
                      type="number"
                      step="0.5"
                      value={interestRateRisk}
                      onChange={(e) => setInterestRateRisk(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vacancy-period">Leieledie periode (måneder)</Label>
                    <Input
                      id="vacancy-period"
                      type="number"
                      value={vacancyPeriod}
                      onChange={(e) => setVacancyPeriod(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="market-correction">Markedskorreksjon (%)</Label>
                    <Input
                      id="market-correction"
                      type="number"
                      value={marketCorrection}
                      onChange={(e) => setMarketCorrection(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <Card className="shadow-medium border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risikonøkkelindikatorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-card-elevated rounded-lg">
                    <p className="text-sm text-muted-foreground">Belåningsgrad (LTV)</p>
                    <p className={`text-2xl font-bold ${ltvRisk.color}`}>{loanToValue.toFixed(1)}%</p>
                    <Badge variant={ltvRisk.variant} className="mt-2">{ltvRisk.level} risiko</Badge>
                  </div>
                  <div className="text-center p-4 bg-card-elevated rounded-lg">
                    <p className="text-sm text-muted-foreground">Nåværende cashflow</p>
                    <p className={`text-2xl font-bold ${currentCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {currentCashFlow >= 0 ? '+' : ''}{currentCashFlow.toLocaleString()} kr
                    </p>
                    <Badge variant={cashFlowRisk.variant} className="mt-2">{cashFlowRisk.level}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Stresstestresultater
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskScenarios.map((scenario, index) => (
                  <Alert key={index} className={`border-l-4 ${
                    scenario.severity === "Høy" ? "border-l-destructive" : 
                    scenario.severity === "Moderat" ? "border-l-yellow-500" : "border-l-primary"
                  }`}>
                    <AlertDescription className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{scenario.title}</span>
                        <Badge 
                          variant={
                            scenario.severity === "Høy" ? "destructive" : 
                            scenario.severity === "Moderat" ? "secondary" : "default"
                          }
                        >
                          {scenario.severity}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Påvirkning:</span>
                        <span className={`font-semibold ${scenario.impact >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {scenario.impact >= 0 ? '+' : ''}{scenario.impact.toLocaleString()} kr
                        </span>
                      </div>
                      {scenario.newCashFlow !== scenario.impact && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Ny månedlig cashflow:</span>
                          <span className={`font-semibold ${scenario.newCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {scenario.newCashFlow >= 0 ? '+' : ''}{scenario.newCashFlow.toLocaleString()} kr
                          </span>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-medium bg-primary-soft border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Anbefalinger</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {loanToValue > 80 && <li>• Vurder å redusere belåningsgraden til under 80%</li>}
                  {currentCashFlow < 5000 && <li>• Forbedre cashflow før investering</li>}
                  {stressTestCashFlow < 0 && <li>• Investeringen tåler ikke renteøkning - høy risiko</li>}
                  <li>• Oppretthold en kontantreserve tilsvarende 6 måneder med utgifter</li>
                  <li>• Vurder fastrentelån for å redusere renterisiko</li>
                  {vacancyLoss > currentCashFlow * 2 && <li>• Høy sårbarhet for leieledie - vurder forsikring</li>}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button className="flex-1 bg-gradient-primary hover:opacity-90">
                <FileText className="h-4 w-4 mr-2" />
                Legg til i bankerapp
              </Button>
              <Button variant="outline" className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Beregn på nytt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;