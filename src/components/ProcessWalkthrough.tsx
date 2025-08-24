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
      id: 0,
      title: "Gjør gode investeringer",
      description: "Analyser lønnsomhet, risiko og markedspotensial før du kjøper eiendom",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <Calculator className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Lønnsomhetsanalyse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Beregn kontantstrøm, avkastning og tilbakebetalingstid
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Markedsanalyse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sammenlign priser og leieinntekter i området
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Risikoevaluering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Identifiser potensielle risikoer og få anbefalinger
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-muted-foreground">
            Få en fullstendig analyse før du investerer i ny eiendom
          </p>
        </div>
      )
    },
    {
      id: 1,
      title: "Overvåk utleieforhold",
      description: "Hold oversikt over leiekontrakter, vedlikehold og økonomiske resultater",
      icon: Home,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Leieforholdsoversikt</CardTitle>
                <CardDescription>Aktive leiekontrakter og leietakere</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Storgata 15</span>
                    <span className="text-primary font-bold">15,000 kr/mnd</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Bjørnebærvei 8</span>
                    <span className="text-primary font-bold">18,500 kr/mnd</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Månedlige resultater</CardTitle>
                <CardDescription>Inntekter, utgifter og netto kontantstrøm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leieinntekter:</span>
                    <span className="font-bold text-green-600">+33,500 kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utgifter:</span>
                    <span className="font-bold text-red-600">-8,200 kr</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Netto kontantstrøm:</span>
                    <span className="font-bold text-primary">+25,300 kr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Porteføljeoversikt",
      description: "Se hvordan hele porteføljen utvikler seg over tid med detaljerte analyser",
      icon: PieChart,
      content: (
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Porteføljeytelse</CardTitle>
              <CardDescription>Samlet verdiutvikling og avkastning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-soft rounded-lg">
                  <p className="text-2xl font-bold text-primary">2.8M kr</p>
                  <p className="text-sm text-muted-foreground">Samlet verdi</p>
                </div>
                <div className="text-center p-4 bg-gradient-soft rounded-lg">
                  <p className="text-2xl font-bold text-green-600">+12.5%</p>
                  <p className="text-sm text-muted-foreground">Årlig avkastning</p>
                </div>
                <div className="text-center p-4 bg-gradient-soft rounded-lg">
                  <p className="text-2xl font-bold text-primary">285k kr</p>
                  <p className="text-sm text-muted-foreground">Årlig kontantstrøm</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-center text-muted-foreground">
            Få full oversikt over porteføljens utvikling og identifiser muligheter for optimalisering
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