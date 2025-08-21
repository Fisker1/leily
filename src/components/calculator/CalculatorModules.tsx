import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  Target, 
  Calendar,
  BarChart3,
  FileText,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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
  onModuleActivate: (moduleId: string) => void;
  onGenerateReport: () => void;
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
  monthlyCashFlow,
  onModuleActivate,
  onGenerateReport
}: CalculatorModulesProps) => {
  const navigate = useNavigate();
  const { isModuleActivated, updateField } = useCalculatorData();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const handleGenerateReport = () => {
    onGenerateReport();
  };

  const handleModuleClick = (moduleId: string) => {
    if (activeModule === moduleId) {
      setActiveModule(null);
    } else {
      setActiveModule(moduleId);
      onModuleActivate(moduleId);
    }
  };

  const modules = [
    {
      id: "Lönnsomhetsanalyse",
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
      ),
      inputs: null
    },
    {
      id: "Avanserte beregninger",
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
      ),
      inputs: (
        <Card className="mt-4 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tilleggsinformasjon for avanserte beregninger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renovationBudget">Oppussingskostnader</Label>
                <Input
                  id="renovationBudget"
                  type="number"
                  placeholder="200000"
                  onChange={(e) => updateField('renovationCost', e.target.value, 'Avanserte beregninger')}
                />
              </div>
              <div>
                <Label htmlFor="marketAppreciation">Forventet årlig verdistigning (%)</Label>
                <Input
                  id="marketAppreciation"
                  type="number"
                  placeholder="3"
                  step="0.1"
                  onChange={(e) => updateField('marketAppreciation', e.target.value, 'Avanserte beregninger')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "Markedsanalyse",
      title: "Markedsanalyse",
      description: "Sammenlign priser og leieinntekter i området for å forstå markedspotensialet",
      icon: TrendingUp,
      badge: "Premium",
      component: (
        <MarketAnalysis
          propertyValue={propertyValue}
          monthlyRent={monthlyRent}
        />
      ),
      inputs: (
        <Card className="mt-4 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Markedsdata for området</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="areaCode">Postnummer/område</Label>
                <Input
                  id="areaCode"
                  placeholder="0250"
                  onChange={(e) => updateField('areaCode', e.target.value, 'Markedsanalyse')}
                />
              </div>
              <div>
                <Label htmlFor="propertyType">Boligtype</Label>
                <Input
                  id="propertyType"
                  placeholder="3-roms leilighet"
                  onChange={(e) => updateField('propertyType', e.target.value, 'Markedsanalyse')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "Risikoevaluering",
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
      ),
      inputs: (
        <Card className="mt-4 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Risikofaktorer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vacancyRate">Forventet leieledie (%)</Label>
                <Input
                  id="vacancyRate"
                  type="number"
                  placeholder="5"
                  step="0.1"
                  onChange={(e) => updateField('vacancyRate', e.target.value, 'Risikoevaluering')}
                />
              </div>
              <div>
                <Label htmlFor="maintenanceReserve">Vedlikeholdsbuffer (kr/år)</Label>
                <Input
                  id="maintenanceReserve"
                  type="number"
                  placeholder="20000"
                  onChange={(e) => updateField('maintenanceReserve', e.target.value, 'Risikoevaluering')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "Avkastningsanalyse",
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
      ),
      inputs: (
        <Card className="mt-4 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Fremskrivningsparametere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectionYears">Fremskrivingsperiode (år)</Label>
                <Input
                  id="projectionYears"
                  type="number"
                  placeholder="10"
                  onChange={(e) => updateField('projectionYears', e.target.value, 'Avkastningsanalyse')}
                />
              </div>
              <div>
                <Label htmlFor="rentGrowth">Forventet leievekst (% per år)</Label>
                <Input
                  id="rentGrowth"
                  type="number"
                  placeholder="3"
                  step="0.1"
                  onChange={(e) => updateField('rentGrowth', e.target.value, 'Avkastningsanalyse')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module.id}>
            <Card 
              className={`cursor-pointer hover:shadow-medium transition-all border-primary/20 group ${
                isModuleActivated(module.id) || activeModule === module.id ? 'ring-2 ring-primary/50 shadow-medium' : ''
              }`}
              onClick={() => handleModuleClick(module.id)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-soft rounded-lg group-hover:scale-110 transition-transform">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm leading-tight">{module.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={module.badge === "Premium" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {module.badge}
                    </Badge>
                    {isModuleActivated(module.id) && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        ✓ Aktivert
                      </Badge>
                    )}
                    {activeModule === module.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Module Input Form */}
            {activeModule === module.id && module.inputs && (
              <div className="ml-4">
                {module.inputs}
              </div>
            )}
            
            {/* Module Component Display */}
            {isModuleActivated(module.id) && activeModule === module.id && (
              <div className="ml-4 mt-4">
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
                        {module.id === "Risikoevaluering" && (
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
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generate Report Section */}
      <Card className="shadow-medium bg-gradient-soft border-primary/20 mt-8">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generer bankrapport
          </CardTitle>
          <CardDescription>
            Basert på grunnleggende data{Array.from(new Set(modules.filter(m => isModuleActivated(m.id)).map(m => m.id))).length > 0 && 
              ` og ${Array.from(new Set(modules.filter(m => isModuleActivated(m.id)).map(m => m.id))).length} valgte analysemoduler`}
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
              Generer fullstendig bankrapport
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