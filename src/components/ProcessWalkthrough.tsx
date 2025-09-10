import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft,
  X,
  Target,
  Home,
  PieChart
} from "lucide-react";

interface ProcessWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProcessWalkthrough = ({ isOpen, onClose }: ProcessWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Start med kalkulatoren",
      description: "Bruk vår avanserte kalkulator for å analysere eiendomsinvesteringer.",
      icon: Calculator,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-soft p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Profesjonelle beregninger</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Lønnsomhetsanalyse med cash flow</li>
              <li>• Avkastningsberegninger</li>
              <li>• Finansieringsscenarier</li>
              <li>• Risikoevaluering</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Få detaljerte analyser på minutter med våre profesjonelle kalkulatorer.
          </p>
        </div>
      )
    },
    {
      id: 2,
      title: "Opprett din portefølje",
      description: "Administrer alle dine eiendommer og leieforhold på ett sted.",
      icon: Home,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary-soft p-3 rounded-lg text-center">
              <Home className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Eiendommer</p>
            </div>
            <div className="bg-primary-soft p-3 rounded-lg text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Leietakere</p>
            </div>
            <div className="bg-orange-muted/20 border border-orange-border/30 p-3 rounded-lg text-center">
              <BarChart3 className="h-6 w-6 text-orange mx-auto mb-1" />
              <p className="text-xs font-medium">Kontrakter</p>
            </div>
            <div className="bg-orange-muted/20 border border-orange-border/30 p-3 rounded-lg text-center">
              <PieChart className="h-6 w-6 text-orange mx-auto mb-1" />
              <p className="text-xs font-medium">Depositum</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Hold full oversikt over din eiendomsportefølje med vårt dashboard.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "Generer rapporter",
      description: "Få profesjonelle PDF-rapporter for bank og rådgivere.",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-soft p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Bankrapporter inneholder:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Detaljerte lønnsomhetsberegninger</li>
              <li>• Markedsanalyse og sammenligning</li>
              <li>• Finansieringsscenarier</li>
              <li>• Risikoevaluering</li>
              <li>• Profesjonelle anbefalinger</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Profesjonelle rapporter som bankene setter pris på og som styrker lånesøknaden din.
          </p>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Hvordan Leily fungerer
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Steg {currentStep + 1} av {steps.length}</span>
              <span>{Math.round(progress)}% fullført</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Step Header */}
          <div className="text-center space-y-4">
            <div className="p-4 bg-primary-soft rounded-full w-fit mx-auto">
              <currentStepData.icon className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="animate-fade-in">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Forrige
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2 bg-gradient-primary"
              >
                Neste
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="bg-gradient-primary"
              >
                Start analysen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessWalkthrough;