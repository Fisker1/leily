import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  Target, 
  Calendar,
  BarChart3,
  FileText,
  Settings,
  ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AdvancedCalculations from "./AdvancedCalculations";
import MarketAnalysis from "./MarketAnalysis";
import RiskEvaluation from "./RiskEvaluation";
import ProfitabilityCalculator from "./ProfitabilityCalculator";
import YieldCalculators from "./YieldCalculators";
import { useCalculatorData } from "@/hooks/useCalculatorData";

interface CalculatorModulesProps {
  propertyValue: number;
  monthlyRent: number;
  expenses: number;
  loanAmount: number;
  interestRate: number;
  loanPeriod: number;
  monthlyLoanPayment: number;
  calculatorMode: 'investment' | 'private';
  monthlyCashFlow: number;
}

const CalculatorModules = ({
  propertyValue,
  monthlyRent,
  expenses,
  loanAmount,
  interestRate,
  loanPeriod,
  monthlyLoanPayment,
  calculatorMode,
  monthlyCashFlow
}: CalculatorModulesProps) => {
  const navigate = useNavigate();
  const { getReportData } = useCalculatorData();

  const handleGenerateReport = () => {
    const reportData = getReportData();
    navigate('/bank-report', { state: reportData });
  };

  const modules = [
    {
      id: "profitability",
      title: "Beregn lønnsomhet",
      description: "Få en rask oversikt over investeringens potensial",
      icon: Target,
      badge: "Grunnleggende",
      component: (
        <ProfitabilityCalculator
          propertyValue={propertyValue}
          monthlyRent={monthlyRent}
          expenses={expenses}
          loanAmount={loanAmount}
          monthlyLoanPayment={monthlyLoanPayment}
          calculatorMode={calculatorMode}
        />
      )
    },
    {
      id: "advanced",
      title: "Avanserte beregninger",
      description: "Detaljerte analyser av cash flow, avkastning og finansieringskostnader",
      icon: Calculator,
      badge: "Premium",
      component: (
        <AdvancedCalculations
          propertyValue={propertyValue}
          monthlyRent={monthlyRent}
          expenses={expenses}
          loanAmount={loanAmount}
          interestRate={interestRate}
          loanPeriod={loanPeriod}
        />
      )
    },
    {
      id: "market",
      title: "Markedsanalyse",
      description: "Sammenlign priser og leieinntekter i området for å forstå markedspotensialet",
      icon: TrendingUp,
      badge: "Premium",
      component: (
        <MarketAnalysis
          propertyValue={propertyValue}
          monthlyRent={monthlyRent}
        />
      )
    },
    {
      id: "risk",
      title: "Risikoevaluering",
      description: "Identifiser potensielle risikoer og få anbefalinger for å optimalisere investeringsstrategien",
      icon: Shield,
      badge: "Premium",
      component: (
        <RiskEvaluation
          propertyValue={propertyValue}
          monthlyRent={monthlyRent}
          loanAmount={loanAmount}
          cashFlow={monthlyCashFlow}
        />
      )
    },
    {
      id: "yields",
      title: "Avkastningskalkulatorer",
      description: "Månedlig og årlig avkastning med fremskrivninger",
      icon: BarChart3,
      badge: "Premium", 
      component: (
        <YieldCalculators
          propertyValue={propertyValue}
          monthlyRent={monthlyRent}
          expenses={expenses}
        />
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">Velg analysemodul</h3>
        <p className="text-muted-foreground">
          Jo flere moduler du bruker, desto mer detaljert blir din bankerapp
        </p>
      </div>

      <Tabs defaultValue="profitability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          {modules.map((module) => (
            <TabsTrigger
              key={module.id}
              value={module.id}
              className="flex flex-col items-center gap-2 p-4 h-auto"
            >
              <module.icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight text-center">
                {module.title.split(' ')[0]}
                {module.title.includes(' ') && (
                  <>
                    <br />
                    {module.title.split(' ').slice(1).join(' ')}
                  </>
                )}
              </span>
              <Badge 
                variant={module.badge === "Premium" ? "default" : "secondary"}
                className="text-xs"
              >
                {module.badge}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {modules.map((module) => (
          <TabsContent key={module.id} value={module.id} className="space-y-6">
            <Card className="shadow-soft border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-soft rounded-lg">
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{module.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={module.badge === "Premium" ? "default" : "secondary"}>
                      {module.badge}
                    </Badge>
                    {module.id === "risk" && (
                      <Link to="/calculator/risk-analysis">
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Detaljert analyse
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {module.component}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="shadow-medium bg-gradient-soft border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generer bankerapp
          </CardTitle>
          <CardDescription>
            Basert på de modulene du har brukt, generer en profesjonell rapport for banken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground"
              size="lg"
              onClick={handleGenerateReport}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generer fullstendig bankerapp
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              size="lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              Tilpass rapport
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Rapporten inkluderer alle beregninger og analyser fra de modulene du har brukt
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorModules;