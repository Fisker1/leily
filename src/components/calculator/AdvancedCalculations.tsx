import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AdvancedCalculationsProps {
  propertyValue: number;
  monthlyRent: number;
  expenses: number;
  loanAmount: number;
  interestRate: number;
  loanPeriod: number;
}

const AdvancedCalculations = ({
  propertyValue,
  monthlyRent,
  expenses,
  loanAmount,
  interestRate,
  loanPeriod
}: AdvancedCalculationsProps) => {
  const [taxRate, setTaxRate] = useState("22");
  const [appreciation, setAppreciation] = useState("3");
  const [vacancyRate, setVacancyRate] = useState("5");
  const [maintenanceReserve, setMaintenanceReserve] = useState("2");

  // Advanced calculations
  const monthlyInterest = interestRate / 100 / 12;
  const numberOfPayments = loanPeriod * 12;
  const monthlyLoanPayment = loanAmount * 
    (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);

  const effectiveMonthlyRent = monthlyRent * (1 - parseFloat(vacancyRate) / 100);
  const monthlyMaintenance = propertyValue * (parseFloat(maintenanceReserve) / 100) / 12;
  const netOperatingIncome = (effectiveMonthlyRent - expenses - monthlyMaintenance) * 12;
  const cashFlow = effectiveMonthlyRent - expenses - monthlyMaintenance - monthlyLoanPayment;
  
  const capRate = (netOperatingIncome / propertyValue) * 100;
  const cashOnCashReturn = ((cashFlow * 12) / (propertyValue - loanAmount)) * 100;
  
  const annualAppreciation = propertyValue * (parseFloat(appreciation) / 100);
  const totalReturn = (cashFlow * 12) + annualAppreciation;
  const totalReturnPercentage = (totalReturn / (propertyValue - loanAmount)) * 100;

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-primary">Avanserte Beregninger</CardTitle>
        <CardDescription>
          Detaljerte analyser av cash flow, avkastning og finansieringskostnader
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tax-rate">Skattesats (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="appreciation">Årlig verdiøkning (%)</Label>
            <Input
              id="appreciation"
              type="number"
              step="0.1"
              value={appreciation}
              onChange={(e) => setAppreciation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vacancy-rate">Leieledie (%)</Label>
            <Input
              id="vacancy-rate"
              type="number"
              step="0.1"
              value={vacancyRate}
              onChange={(e) => setVacancyRate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maintenance-reserve">Vedlikeholdsreserve (%)</Label>
            <Input
              id="maintenance-reserve"
              type="number"
              step="0.1"
              value={maintenanceReserve}
              onChange={(e) => setMaintenanceReserve(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cap Rate:</span>
              <span className="font-semibold text-primary">{capRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cash-on-Cash avkastning:</span>
              <span className="font-semibold text-accent">{cashOnCashReturn.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NOI (årlig):</span>
              <span className="font-semibold">{netOperatingIncome.toLocaleString()} kr</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total avkastning:</span>
              <span className="font-semibold text-primary">{totalReturnPercentage.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Årlig verdiøkning:</span>
              <span className="font-semibold">{annualAppreciation.toLocaleString()} kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Månedlig cashflow:</span>
              <span className={`font-semibold ${cashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {cashFlow >= 0 ? '+' : ''}{cashFlow.toLocaleString()} kr
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedCalculations;