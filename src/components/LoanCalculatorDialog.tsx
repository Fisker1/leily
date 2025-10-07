import { useState, useEffect } from 'react';
import { Calculator, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoanCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (data: LoanSettings) => void;
  hasCredits: boolean;
}

export interface LoanSettings {
  propertyPrice: number;
  interestRate: number;
  loanPeriod: number;
  desiredLoanAmount: number;
  equityAmount: number;
}

export const LoanCalculatorDialog = ({ open, onOpenChange, onApply, hasCredits }: LoanCalculatorDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  const [propertyPrice, setPropertyPrice] = useState(6000000);
  const [interestRate, setInterestRate] = useState(4.99);
  const [loanPeriod, setLoanPeriod] = useState(30);
  const [desiredLoanPercentage, setDesiredLoanPercentage] = useState(75);
  
  const desiredLoanAmount = (propertyPrice * desiredLoanPercentage) / 100;
  const equityAmount = propertyPrice - desiredLoanAmount;
  const equityPercentage = (equityAmount / propertyPrice) * 100;
  
  // Calculate monthly payment
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanPeriod * 12;
  const monthlyPayment = desiredLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  const effectiveRate = interestRate * (1 + 0.03); // Add 3% for fees
  const totalCost = monthlyPayment * numberOfPayments;

  useEffect(() => {
    if (open && user) {
      loadSavedSettings();
    }
  }, [open, user]);

  const loadSavedSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('loan_calculator_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPropertyPrice(Number(data.property_price) || 6000000);
        setInterestRate(Number(data.interest_rate) || 4.99);
        setLoanPeriod(Number(data.loan_period) || 30);
        const loanPct = (Number(data.desired_loan_amount) / Number(data.property_price)) * 100;
        setDesiredLoanPercentage(loanPct || 75);
      }
    } catch (error) {
      console.error('Error loading loan settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    if (!hasCredits) {
      toast.error('Du må ha credits for å bruke lånekalkulatoren');
      return;
    }

    if (!user) {
      toast.error('Du må være logget inn');
      return;
    }

    try {
      setLoading(true);

      const settings = {
        user_id: user.id,
        property_price: propertyPrice,
        interest_rate: interestRate,
        loan_period: loanPeriod,
        desired_loan_amount: desiredLoanAmount,
        equity_amount: equityAmount
      };

      const { error } = await supabase
        .from('loan_calculator_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Låneinnstillinger lagret!');
      
      if (onApply) {
        onApply({
          propertyPrice,
          interestRate,
          loanPeriod,
          desiredLoanAmount,
          equityAmount
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving loan settings:', error);
      toast.error('Kunne ikke lagre innstillinger');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace(/,/g, ' ');
  };

  if (!hasCredits) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Lånekalkulator
            </DialogTitle>
            <DialogDescription>
              Du må ha aktive credits for å bruke lånekalkulatoren
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Lånekalkulatoren er tilgjengelig for brukere med credits. Kjøp credits for å få tilgang.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Lukk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] pr-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Boliglånskalkulator
          </DialogTitle>
          <DialogDescription>
            Beregn månedlige kostnader og egenkapitalbehov. Innstillingene lagres automatisk for fremtidige kalkyler.
          </DialogDescription>
        </DialogHeader>

        {loadingSettings ? (
          <div className="py-8 text-center text-muted-foreground">
            Laster innstillinger...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Property Price */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Boligens pris</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[propertyPrice]}
                  onValueChange={([value]) => setPropertyPrice(value)}
                  min={1000000}
                  max={20000000}
                  step={100000}
                  className="flex-1"
                />
                <div className="w-40">
                  <Input
                    type="text"
                    value={formatCurrency(propertyPrice)}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\s/g, ''));
                      if (!isNaN(num)) setPropertyPrice(num);
                    }}
                    className="text-right font-semibold"
                  />
                </div>
                <span className="text-sm text-muted-foreground">kr</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Rente</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[interestRate]}
                  onValueChange={([value]) => setInterestRate(value)}
                  min={2}
                  max={10}
                  step={0.01}
                  className="flex-1"
                />
                <div className="w-40">
                  <Input
                    type="text"
                    value={interestRate.toFixed(2)}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) setInterestRate(num);
                    }}
                    className="text-right font-semibold"
                  />
                </div>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Loan Period */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Nedbetalingstid</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[loanPeriod]}
                  onValueChange={([value]) => setLoanPeriod(value)}
                  min={5}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <div className="w-40">
                  <Input
                    type="text"
                    value={loanPeriod.toString()}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      if (!isNaN(num)) setLoanPeriod(num);
                    }}
                    className="text-right font-semibold"
                  />
                </div>
                <span className="text-sm text-muted-foreground">år</span>
              </div>
            </div>

            {/* Loan Amount Slider */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Ønsket lånebeløp</Label>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Belåningsgrad: {desiredLoanPercentage.toFixed(0)}%</span>
                  <span className="text-sm text-muted-foreground">Egenkapital: {equityPercentage.toFixed(0)}%</span>
                </div>
                <div className="relative py-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${desiredLoanPercentage}%` }}
                    />
                  </div>
                </div>
                <Slider
                  value={[desiredLoanPercentage]}
                  onValueChange={([value]) => setDesiredLoanPercentage(value)}
                  min={10}
                  max={90}
                  step={1}
                  className="mt-3"
                />
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Lånebeløp</p>
                <p className="text-lg font-bold">{formatCurrency(desiredLoanAmount)} kr</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Egenkapitalbehov</p>
                <p className="text-lg font-bold">{formatCurrency(equityAmount)} kr</p>
              </div>
            </div>

            {/* Monthly Payment Display */}
            <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Lånekostnad</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(monthlyPayment)} <span className="text-lg">kr pr. md.</span>
                </p>
                <div className="flex justify-center gap-8 mt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{interestRate.toFixed(2)} % nom. rente</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{effectiveRate.toFixed(2)} % eff. rente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-muted/50 rounded">
                <span className="text-muted-foreground">Totalkostnad over {loanPeriod} år:</span>
                <span className="font-semibold">{formatCurrency(totalCost)} kr</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Lagrer...' : 'Lagre innstillinger'}
              </Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
