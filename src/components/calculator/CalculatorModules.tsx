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
  selectedModules?: any[];
  calculatorData?: any;
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
  onGenerateReport,
  selectedModules = [],
  calculatorData = {}
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
      badge: "Grunnleggende"
    },
    {
      id: "Avanserte beregninger",
      title: "Avanserte beregninger", 
      description: "10-års cashflow, DSCR og break-even analyse",
      icon: Calculator,
      badge: "Premium"
    },
    {
      id: "Markedsanalyse",
      title: "Markedsanalyse",
      description: "Komparative priser og makrotrender",
      icon: TrendingUp,
      badge: "Premium"
    },
    {
      id: "Risikoevaluering", 
      title: "Risikovurdering",
      description: "Identifiser potensielle risikoer",
      icon: Shield,
      badge: "Standard"
    },
    {
      id: "Avkastningsanalyse",
      title: "Avkastningskalkulator", 
      description: "Månedlig og årlig avkastning",
      icon: BarChart3,
      badge: "Premium"
    },
    {
      id: "Utvidet bankrapport",
      title: "Utvidet fullstendig bankrapport",
      description: "Komplett analyse med utvidede eiendomsdetaljer", 
      icon: FileText,
      badge: "Premium"
    }
  ];

  const handleModuleSelection = (moduleId: string) => {
    // All modules navigate to extended property details page with module context
    navigate('/calculator/extended-details', { 
      state: { 
        propertyValue, 
        monthlyRent, 
        expenses, 
        loanAmount, 
        interestRate, 
        loanPeriod,
        calculatorMode,
        selectedModule: moduleId,
        selectedModules,
        ...calculatorData
      } 
    });
  };

  return (
    <div className="space-y-8">
      {/* Simple Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className="cursor-pointer hover:shadow-large transition-all border-primary/20 group hover:scale-105"
            onClick={() => handleModuleSelection(module.id)}
          >
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-gradient-primary rounded-full group-hover:scale-110 transition-transform">
                  <module.icon className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <Badge 
                    variant={module.badge === "Premium" ? "default" : 
                             module.badge === "Grunnleggende" ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {module.badge}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-foreground">Velg analysemodule over for å utvide rapporten</h4>
            <p className="text-sm text-muted-foreground">
              Hver modul gir deg spesialiserte beregninger som banker og investorer ønsker å se
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorModules;