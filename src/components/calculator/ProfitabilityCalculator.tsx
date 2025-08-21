import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Target, PieChart } from "lucide-react";

interface ProfitabilityCalculatorProps {
  propertyValue: number;
  monthlyRent: number;
  expenses: number;
  loanAmount: number;
  monthlyLoanPayment: number;
  calculatorMode: 'investment' | 'private';
  compact?: boolean;
}

const ProfitabilityCalculator = ({
  propertyValue,
  monthlyRent,
  expenses,
  loanAmount,
  monthlyLoanPayment,
  calculatorMode,
  compact = false
}: ProfitabilityCalculatorProps) => {
  
  const initialInvestment = propertyValue - loanAmount;
  const monthlyCashFlow = calculatorMode === 'investment' 
    ? monthlyRent - expenses - monthlyLoanPayment
    : -expenses - monthlyLoanPayment;
  
  const annualCashFlow = monthlyCashFlow * 12;
  const grossYield = calculatorMode === 'investment' 
    ? ((monthlyRent * 12) / propertyValue) * 100 
    : 0;
  const netYield = calculatorMode === 'investment'
    ? (((monthlyRent - expenses) * 12) / propertyValue) * 100
    : 0;
  
  const cashOnCashReturn = calculatorMode === 'investment' && initialInvestment > 0
    ? (annualCashFlow / initialInvestment) * 100
    : 0;

  const paybackPeriod = calculatorMode === 'investment' && annualCashFlow > 0 
    ? initialInvestment / annualCashFlow
    : null;

  const profitabilityScore = calculatorMode === 'investment' 
    ? Math.min(100, Math.max(0, (netYield * 2) + (cashOnCashReturn * 0.5) + (monthlyCashFlow > 0 ? 20 : -20)))
    : Math.min(100, Math.max(0, 50 + (monthlyCashFlow / 1000)));

  const getProfitabilityLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-primary", bgColor: "bg-primary-soft" };
    if (score >= 60) return { level: "God", color: "text-accent", bgColor: "bg-accent/10" };
    if (score >= 40) return { level: "Akseptabel", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { level: "Risikabel", color: "text-destructive", bgColor: "bg-destructive/10" };
  };

  const profitLevel = getProfitabilityLevel(profitabilityScore);

  // Compact version for preview
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Profitability Score */}
        <div className={`text-center p-3 rounded-lg ${profitLevel.bgColor}`}>
          <div className="flex items-center justify-center gap-2">
            <div className={`text-2xl font-bold ${profitLevel.color}`}>
              {profitabilityScore.toFixed(0)}
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">av 100</div>
              <Badge variant={profitabilityScore >= 60 ? "default" : "secondary"} className="text-xs">
                {profitLevel.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* Key metrics compact */}
        <div className="space-y-2">
          {calculatorMode === 'investment' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Netto Yield:</span>
              <span className="font-semibold text-accent">{netYield.toFixed(1)}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Måned. Cashflow:</span>
            <span className={`font-semibold ${monthlyCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {monthlyCashFlow >= 0 ? '+' : ''}{monthlyCashFlow.toLocaleString()} kr
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Egenkapital:</span>
            <span className="font-semibold">{initialInvestment.toLocaleString()} kr</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Target className="h-5 w-5" />
          Lønnsomhetsanalyse
        </CardTitle>
        <CardDescription>
          Få en rask oversikt over investeringens potensial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profitability Score */}
        <div className={`text-center p-6 rounded-lg ${profitLevel.bgColor}`}>
          <h3 className="text-lg font-semibold text-foreground mb-2">Lønnsomhetscore</h3>
          <div className="flex items-center justify-center gap-3">
            <div className={`text-4xl font-bold ${profitLevel.color}`}>
              {profitabilityScore.toFixed(0)}
            </div>
            <div className="text-left">
              <div className="text-xs text-muted-foreground">av 100</div>
              <Badge variant={profitabilityScore >= 60 ? "default" : "secondary"}>
                {profitLevel.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calculatorMode === 'investment' && (
            <>
              <div className="text-center p-4 bg-card-elevated rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Brutto Yield</p>
                </div>
                <p className="text-2xl font-bold text-primary">{grossYield.toFixed(2)}%</p>
              </div>
              
              <div className="text-center p-4 bg-card-elevated rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <p className="text-sm text-muted-foreground">Netto Yield</p>
                </div>
                <p className="text-2xl font-bold text-accent">{netYield.toFixed(2)}%</p>
              </div>

              <div className="text-center p-4 bg-card-elevated rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PieChart className="h-4 w-4 text-foreground" />
                  <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{cashOnCashReturn.toFixed(2)}%</p>
              </div>

              {paybackPeriod && (
                <div className="text-center p-4 bg-card-elevated rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Tilbakebetalingstid</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {paybackPeriod.toFixed(1)} år
                  </p>
                </div>
              )}
            </>
          )}

          <div className={`text-center p-4 rounded-lg ${monthlyCashFlow >= 0 ? 'bg-primary-soft' : 'bg-destructive/10'} md:col-span-${calculatorMode === 'investment' ? '2' : '1'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${monthlyCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`} />
              <p className="text-sm text-muted-foreground">Månedlig Cashflow</p>
            </div>
            <p className={`text-3xl font-bold ${monthlyCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {monthlyCashFlow >= 0 ? '+' : ''}{monthlyCashFlow.toLocaleString()} kr
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyCashFlow >= 0 ? 'Positiv' : 'Negativ'} cashflow
            </p>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-foreground">Investeringssammendrag</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total investering:</span>
              <span className="font-semibold">{propertyValue.toLocaleString()} kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Egenkapital:</span>
              <span className="font-semibold">{initialInvestment.toLocaleString()} kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lånebeløp:</span>
              <span className="font-semibold">{loanAmount.toLocaleString()} kr</span>
            </div>
            {calculatorMode === 'investment' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Månedlige leieinntekter:</span>
                <span className="font-semibold text-primary">{monthlyRent.toLocaleString()} kr</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Månedlige utgifter:</span>
              <span className="font-semibold text-destructive">{(expenses + monthlyLoanPayment).toLocaleString()} kr</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Netto månedlig resultat:</span>
              <span className={monthlyCashFlow >= 0 ? 'text-primary' : 'text-destructive'}>
                {monthlyCashFlow >= 0 ? '+' : ''}{monthlyCashFlow.toLocaleString()} kr
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-muted p-4 rounded-lg">
          <h5 className="font-semibold text-foreground mb-2">Anbefalinger:</h5>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {profitabilityScore < 40 && <li>• Vurder å justere parametrene for bedre lønnsomhet</li>}
            {calculatorMode === 'investment' && netYield < 4 && <li>• Lav yield - vurder andre investeringsmuligheter</li>}
            {monthlyCashFlow < 0 && <li>• Negativ cashflow krever månedlig tilskudd</li>}
            {calculatorMode === 'investment' && grossYield > 8 && <li>• Høy yield - undersøk området nøye for skjulte risikoer</li>}
            {profitabilityScore >= 60 && <li>• God investeringsmulighet - fortsett med grundig analyse</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitabilityCalculator;