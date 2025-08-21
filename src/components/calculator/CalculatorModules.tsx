import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3,
  FileText,
  X,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
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
  onDataChange: (field: string, value: any) => void;
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
  calculatorData = {},
  onDataChange
}: CalculatorModulesProps) => {
  const [expandedModules, setExpandedModules] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [moduleData, setModuleData] = useState<{[key: string]: any}>({});

  const modules = [
    {
      id: "Lønnsomhetsanalyse",
      title: "Lønnsomhetsanalyse",
      description: "Grunnleggende lønnsomhetsberegninger",
      icon: Target,
      badge: "Grunnleggende",
      color: "bg-blue-500"
    },
    {
      id: "Avanserte beregninger",
      title: "Avanserte beregninger", 
      description: "10-års cashflow, DSCR og break-even analyse",
      icon: Calculator,
      badge: "Premium",
      color: "bg-purple-500"
    },
    {
      id: "Markedsanalyse",
      title: "Markedsanalyse",
      description: "Komparative priser og makrotrender",
      icon: TrendingUp,
      badge: "Premium",
      color: "bg-green-500"
    },
    {
      id: "Risikoevaluering", 
      title: "Risikoevaluering",
      description: "Detaljert risikoanalyse",
      icon: Shield,
      badge: "Standard",
      color: "bg-orange-500"
    },
    {
      id: "Avkastningsanalyse",
      title: "Avkastningsanalyse", 
      description: "Månedlig og årlig avkastningsberegninger",
      icon: BarChart3,
      badge: "Premium",
      color: "bg-indigo-500"
    }
  ];

  const handleExpandModules = () => {
    setExpandedModules(true);
    setActiveModules(modules.map(m => m.id));
  };

  const handleRemoveModule = (moduleId: string) => {
    setActiveModules(prev => prev.filter(id => id !== moduleId));
    // Remove module data as well
    setModuleData(prev => {
      const newData = { ...prev };
      delete newData[moduleId];
      return newData;
    });
  };

  const handleModuleDataChange = (moduleId: string, field: string, value: any) => {
    setModuleData(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value
      }
    }));
  };

  const getModuleData = (moduleId: string) => {
    return moduleData[moduleId] || {};
  };

  const renderModuleForm = (module: any) => {
    const data = getModuleData(module.id);
    
    switch (module.id) {
      case "Lønnsomhetsanalyse":
        return (
          <Card key={module.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <module.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveModule(module.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Brutto yield</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {((monthlyRent * 12) / propertyValue * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Månedlig cashflow</p>
                  <p className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyCashFlow.toLocaleString()} kr
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "Avanserte beregninger":
        return (
          <Card key={module.id} className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <module.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveModule(module.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Årlig KPI-vekst leie (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={data.annualKpiGrowthRent || 2}
                    onChange={(e) => handleModuleDataChange(module.id, 'annualKpiGrowthRent', parseFloat(e.target.value))}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label>Vacancy - leieledie (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={data.vacancyRate || 5}
                    onChange={(e) => handleModuleDataChange(module.id, 'vacancyRate', parseFloat(e.target.value))}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Eiendomsstørrelse (m²)</Label>
                  <Input
                    type="number"
                    value={data.propertySize || 85}
                    onChange={(e) => handleModuleDataChange(module.id, 'propertySize', parseInt(e.target.value))}
                    placeholder="85"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "Markedsanalyse":
        return (
          <Card key={module.id} className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <module.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveModule(module.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Område</Label>
                  <Input
                    value={data.propertyArea || "Oslo sentrum"}
                    onChange={(e) => handleModuleDataChange(module.id, 'propertyArea', e.target.value)}
                    placeholder="Oslo sentrum"
                  />
                </div>
                <div>
                  <Label>Estimert eiendomsverdi</Label>
                  <Input
                    type="number"
                    value={data.propertyValueEstimate || propertyValue}
                    onChange={(e) => handleModuleDataChange(module.id, 'propertyValueEstimate', parseInt(e.target.value))}
                    placeholder={propertyValue.toString()}
                  />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium">Markedstrender siste 3 år:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Prisvekst: {data.priceGrowthLast3Years || 8}%</li>
                  <li>• Leievekst: {data.rentGrowthLast3Years || 5}%</li>
                  <li>• Salgs-tid: {data.averageDaysOnMarket || 22} dager</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case "Risikoevaluering":
        return (
          <Card key={module.id} className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <module.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveModule(module.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Byggeår</Label>
                  <Input
                    type="number"
                    value={data.buildingYear || 1985}
                    onChange={(e) => handleModuleDataChange(module.id, 'buildingYear', parseInt(e.target.value))}
                    placeholder="1985"
                  />
                </div>
                <div>
                  <Label>Sist renovert</Label>
                  <Input
                    type="number"
                    value={data.lastRenovation || 2018}
                    onChange={(e) => handleModuleDataChange(module.id, 'lastRenovation', parseInt(e.target.value))}
                    placeholder="2018"
                  />
                </div>
              </div>
              <div>
                <Label>Energimåling</Label>
                <Select 
                  value={data.energyRating || "C"} 
                  onValueChange={(value) => handleModuleDataChange(module.id, 'energyRating', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg energimåling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Meget lav</SelectItem>
                    <SelectItem value="B">B - Lav</SelectItem>
                    <SelectItem value="C">C - Middels</SelectItem>
                    <SelectItem value="D">D - Høy</SelectItem>
                    <SelectItem value="E">E - Meget høy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case "Avkastningsanalyse":
        return (
          <Card key={module.id} className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <module.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveModule(module.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Netto yield</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {(((monthlyRent * 12 - expenses * 12) / propertyValue) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Cap Rate</p>
                  <p className="text-xl font-bold text-blue-600">
                    {(((monthlyRent * 12 - expenses * 12) / propertyValue) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Cash-on-Cash</p>
                  <p className="text-xl font-bold text-green-600">
                    {(((monthlyRent * 12 - expenses * 12 - monthlyLoanPayment * 12) / (propertyValue - loanAmount)) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const handleGenerateReportWithModules = () => {
    // Pass the active modules and their data to the report generator
    const activatedModules = activeModules.map(moduleId => {
      const module = modules.find(m => m.id === moduleId);
      return module?.title || moduleId;
    });
    
    // Create report data with module information
    const reportData = {
      basicData: {
        propertyValue,
        monthlyRent,
        loanAmount,
        interestRate,
        loanPeriod,
        expenses,
        monthlyLoanPayment,
        monthlyCashFlow,
        calculatorMode
      },
      activatedModules,
      moduleData,
      ...calculatorData
    };

    onGenerateReport();
  };

  if (!expandedModules) {
    return (
      <div className="text-center space-y-6">
        <Button 
          size="lg" 
          className="px-12 py-6 text-lg bg-gradient-primary hover:opacity-90"
          onClick={handleExpandModules}
        >
          <Plus className="h-6 w-6 mr-3" />
          Utvid fullstendig bankrapport
        </Button>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Få tilgang til alle 5 analysemodulene og fyll dem ut etter behov. Du kan fjerne moduler du ikke ønsker med X-knappen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setExpandedModules(false)}
          className="mb-6"
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          Skjul moduler
        </Button>
      </div>

      {/* Module Forms */}
      <div className="space-y-6">
        {activeModules.map(moduleId => {
          const module = modules.find(m => m.id === moduleId);
          return module ? renderModuleForm(module) : null;
        })}
      </div>

      {/* Module Summary */}
      {activeModules.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Moduler i rapporten ({activeModules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {activeModules.map(moduleId => {
                const module = modules.find(m => m.id === moduleId);
                return module ? (
                  <Badge key={moduleId} variant="secondary" className="flex items-center gap-1">
                    <module.icon className="h-3 w-3" />
                    {module.title}
                  </Badge>
                ) : null;
              })}
            </div>
            <Button 
              size="lg" 
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleGenerateReportWithModules}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generer rapport med {activeModules.length} moduler
            </Button>
          </CardContent>
        </Card>
      )}

      {activeModules.length === 0 && (
        <Card className="bg-muted/50 border-muted">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Alle moduler er fjernet. Klikk knappen over for å legge til moduler igjen, eller generer en enkel rapport.
            </p>
            <Button onClick={onGenerateReport} variant="outline">
              Generer enkel rapport
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalculatorModules;