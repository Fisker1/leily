import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('no-NO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace(/,/g, ' ');
};

const LoanPieChart = ({ loanPercentage, equityPercentage }: { loanPercentage: number; equityPercentage: number }) => {
  const size = 140;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const loanDash = (Math.min(loanPercentage, 100) / 100) * circumference;
  const gapDash = circumference - loanDash;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Equity (background) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-emerald-100 dark:text-emerald-900/40"
        />
        {/* Loan (foreground) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${loanDash} ${gapDash}`}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{loanPercentage.toFixed(0)}%</span>
        <span className="text-xs text-muted-foreground">belåning</span>
      </div>
    </div>
  );
};

export const SimpleLoanCalculator = () => {
  const [propertyPrice, setPropertyPrice] = useState(4000000);
  const [loanAmount, setLoanAmount] = useState(3000000);
  const [interestRate, setInterestRate] = useState(4.99);
  const [loanPeriod, setLoanPeriod] = useState(25);

  const equityAmount = propertyPrice - loanAmount;
  const loanPercentage = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;
  const equityPercentage = 100 - loanPercentage;

  const handlePropertyPriceChange = (value: number) => {
    setPropertyPrice(value);
    if (loanAmount > value) {
      setLoanAmount(value);
    }
  };

  const handleLoanAmountChange = (value: number) => {
    setLoanAmount(Math.min(value, propertyPrice));
  };

  // Annuitetsberegning
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanPeriod * 12;
  const monthlyPayment =
    loanAmount > 0 && monthlyRate > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
      : 0;
  const effectiveRate = interestRate * (1 + 0.03);
  const totalCost = monthlyPayment * numberOfPayments;
  const totalInterest = totalCost - loanAmount;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="space-y-6 pt-6">
        {/* Boligpris */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Boligpris</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[propertyPrice]}
              onValueChange={([value]) => handlePropertyPriceChange(value)}
              min={500000}
              max={20000000}
              step={50000}
              className="flex-1"
            />
            <div className="w-40">
              <Input
                type="text"
                value={formatCurrency(propertyPrice)}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\s/g, ''));
                  if (!isNaN(num) && num >= 0) handlePropertyPriceChange(num);
                }}
                className="text-right font-semibold"
              />
            </div>
            <span className="text-sm text-muted-foreground">kr</span>
          </div>
        </div>

        {/* Lånebeløp */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Lånebeløp</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[loanAmount]}
              onValueChange={([value]) => handleLoanAmountChange(value)}
              min={0}
              max={propertyPrice}
              step={50000}
              className="flex-1"
            />
            <div className="w-40">
              <Input
                type="text"
                value={formatCurrency(loanAmount)}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\s/g, ''));
                  if (!isNaN(num) && num >= 0) handleLoanAmountChange(num);
                }}
                className="text-right font-semibold"
              />
            </div>
            <span className="text-sm text-muted-foreground">kr</span>
          </div>
        </div>

        {/* Rente */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Nominell rente</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[interestRate]}
              onValueChange={([value]) => setInterestRate(value)}
              min={1}
              max={12}
              step={0.01}
              className="flex-1"
            />
            <div className="w-40">
              <Input
                type="text"
                value={interestRate.toFixed(2)}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num) && num >= 0) setInterestRate(num);
                }}
                className="text-right font-semibold"
              />
            </div>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* Nedbetalingstid */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Nedbetalingstid</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[loanPeriod]}
              onValueChange={([value]) => setLoanPeriod(value)}
              min={5}
              max={30}
              step={1}
              className="flex-1"
            />
            <div className="w-40">
              <Input
                type="text"
                value={loanPeriod.toString()}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  if (!isNaN(num) && num > 0) setLoanPeriod(num);
                }}
                className="text-right font-semibold"
              />
            </div>
            <span className="text-sm text-muted-foreground">år</span>
          </div>
        </div>

        {/* Resultat: Månedlig kostnad + Kakediagram */}
        <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
          <div className="flex items-center gap-6">
            {/* Månedlig kostnad - venstre */}
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Månedlig lånekostnad</p>
              <p className="text-3xl sm:text-4xl font-bold text-primary">
                {formatCurrency(Math.round(monthlyPayment))} <span className="text-base">kr/mnd</span>
              </p>
              <div className="flex gap-6 mt-3 text-sm">
                <p className="text-muted-foreground">{interestRate.toFixed(2)} % nom. rente</p>
                <p className="text-muted-foreground">{effectiveRate.toFixed(2)} % eff. rente</p>
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Lån: {formatCurrency(loanAmount)} kr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                  <span className="text-muted-foreground">EK: {formatCurrency(equityAmount)} kr</span>
                </div>
              </div>
            </div>

            {/* Kakediagram - høyre */}
            <div className="flex-shrink-0">
              <LoanPieChart loanPercentage={loanPercentage} equityPercentage={equityPercentage} />
            </div>
          </div>
        </div>

        {/* Totalkostnader */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between p-3 bg-muted/50 rounded border">
            <span className="text-muted-foreground">Totalkostnad over {loanPeriod} år</span>
            <span className="font-semibold">{formatCurrency(Math.round(totalCost))} kr</span>
          </div>
          <div className="flex justify-between p-3 bg-muted/50 rounded border">
            <span className="text-muted-foreground">Totale rentekostnader</span>
            <span className="font-semibold">{formatCurrency(Math.round(totalInterest))} kr</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
