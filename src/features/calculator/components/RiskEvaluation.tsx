import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { useState } from "react";

interface RiskEvaluationProps {
  propertyValue: number;
  monthlyRent: number;
  loanAmount: number;
  cashFlow: number;
}

const RiskEvaluation = ({ propertyValue, monthlyRent, loanAmount, cashFlow }: RiskEvaluationProps) => {
  const [interestRateRisk, setInterestRateRisk] = useState("2"); // Potential increase
  const [vacancyPeriod, setVacancyPeriod] = useState("2"); // Months
  const [maintenanceCost, setMaintenanceCost] = useState("50000"); // Annual
  const [marketCorrection, setMarketCorrection] = useState("10"); // Percentage drop

  // Risk calculations
  const loanToValue = (loanAmount / propertyValue) * 100;
  const debtServiceCoverage = (monthlyRent * 12) / (loanAmount * 0.06); // Assuming 6% interest
  const cashFlowRisk = cashFlow / monthlyRent; // Cushion ratio
  
  // Stress test scenarios
  const stressTestCashFlow = monthlyRent - (loanAmount * (parseFloat(interestRateRisk) / 100) / 12);
  const vacancyLoss = monthlyRent * parseFloat(vacancyPeriod);
  const stressedPropertyValue = propertyValue * (1 - parseFloat(marketCorrection) / 100);
  const stressedLTV = (loanAmount / stressedPropertyValue) * 100;

  const getRiskLevel = (value: number, thresholds: number[]) => {
    if (value <= thresholds[0]) return { level: "Lav", color: "text-primary", variant: "default" as const };
    if (value <= thresholds[1]) return { level: "Moderat", color: "text-yellow-600", variant: "secondary" as const };
    return { level: "Høy", color: "text-destructive", variant: "destructive" as const };
  };

  const ltvRisk = getRiskLevel(loanToValue, [70, 85]);
  const cashFlowRisk_level = getRiskLevel(-cashFlowRisk * 100, [-20, -10]);

  const risks = [
    {
      title: "Renteøkning på " + interestRateRisk + "%",
      impact: stressTestCashFlow,
      severity: stressTestCashFlow < 0 ? "Høy" : stressTestCashFlow < cashFlow * 0.5 ? "Moderat" : "Lav"
    },
    {
      title: vacancyPeriod + " måneder leieledie", 
      impact: -vacancyLoss,
      severity: vacancyLoss > Math.abs(cashFlow) * 3 ? "Høy" : vacancyLoss > Math.abs(cashFlow) ? "Moderat" : "Lav"
    },
    {
      title: "Markedskorreksjon på " + marketCorrection + "%",
      impact: stressedPropertyValue - propertyValue,
      severity: stressedLTV > 90 ? "Høy" : stressedLTV > 80 ? "Moderat" : "Lav"
    }
  ];

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-primary">Risikoevaluering</CardTitle>
        <CardDescription>
          Identifiser potensielle risikoer og få anbefalinger for å optimalisere investeringsstrategien
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Label htmlFor="maintenance-cost">Årlige vedlikeholdskostnader (kr)</Label>
            <Input
              id="maintenance-cost"
              type="number"
              value={maintenanceCost}
              onChange={(e) => setMaintenanceCost(e.target.value)}
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

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risikonøkkelindikatorer
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-card-elevated rounded-lg">
              <p className="text-sm text-muted-foreground">Belåningsgrad (LTV)</p>
              <p className={`text-xl font-bold ${ltvRisk.color}`}>{loanToValue.toFixed(1)}%</p>
              <Badge variant={ltvRisk.variant} className="mt-1">{ltvRisk.level} risiko</Badge>
            </div>
            <div className="text-center p-4 bg-card-elevated rounded-lg">
              <p className="text-sm text-muted-foreground">Dekningsgrad</p>
              <p className="text-xl font-bold text-foreground">{debtServiceCoverage.toFixed(1)}x</p>
              <Badge variant={debtServiceCoverage > 1.3 ? "default" : "destructive"} className="mt-1">
                {debtServiceCoverage > 1.3 ? "Trygg" : "Risiko"}
              </Badge>
            </div>
            <div className="text-center p-4 bg-card-elevated rounded-lg">
              <p className="text-sm text-muted-foreground">Cashflow-buffer</p>
              <p className={`text-xl font-bold ${cashFlow > 0 ? 'text-primary' : 'text-destructive'}`}>
                {(cashFlowRisk * 100).toFixed(1)}%
              </p>
              <Badge variant={cashFlowRisk_level.variant} className="mt-1">{cashFlowRisk_level.level}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stresstestscenarier
          </h4>
          {risks.map((risk, index) => (
            <Alert key={index} className={`border-l-4 ${
              risk.severity === "Høy" ? "border-l-destructive" : 
              risk.severity === "Moderat" ? "border-l-yellow-500" : "border-l-primary"
            }`}>
              <AlertDescription className="flex justify-between items-center">
                <span>{risk.title}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${risk.impact >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {risk.impact >= 0 ? '+' : ''}{risk.impact.toLocaleString()} kr
                  </span>
                  <Badge 
                    variant={
                      risk.severity === "Høy" ? "destructive" : 
                      risk.severity === "Moderat" ? "secondary" : "default"
                    }
                  >
                    {risk.severity}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        <div className="bg-primary-soft p-4 rounded-lg">
          <h5 className="font-semibold text-foreground mb-2">Anbefalinger:</h5>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {loanToValue > 80 && <li>• Vurder å redusere belåningsgraden til under 80%</li>}
            {cashFlow < 0 && <li>• Forbedre cashflow før investering</li>}
            {debtServiceCoverage < 1.3 && <li>• Øk leieinntektene eller reduser lånekostnader</li>}
            <li>• Oppretthold en kontantreserve tilsvarende 6 måneder med utgifter</li>
            <li>• Vurder fastrentelån for å redusere renterisiko</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskEvaluation;