import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, Calculator } from "lucide-react";

interface PropertyProfitabilityChartProps {
  purchasePrice: number;
  loanAmount: number;
  interestRate: number;
  loanDurationYears: number;
  currentValue?: number;
}

export const PropertyProfitabilityChart = ({
  purchasePrice,
  loanAmount,
  interestRate,
  loanDurationYears,
  currentValue
}: PropertyProfitabilityChartProps) => {
  // Calculate monthly payment
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanDurationYears * 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);

  // Generate data for the next 10 years
  const generateProfitabilityData = () => {
    const data = [];
    let remainingLoan = loanAmount;
    const equity = purchasePrice - loanAmount;
    const appreciationRate = 0.03; // 3% annual appreciation
    
    for (let year = 0; year <= 10; year++) {
      // Calculate remaining loan balance
      if (year > 0 && year <= loanDurationYears) {
        const paymentsThisYear = Math.min(12, (loanDurationYears - year + 1) * 12);
        const interestPaid = remainingLoan * (interestRate / 100);
        const principalPaid = (monthlyPayment * 12) - interestPaid;
        remainingLoan = Math.max(0, remainingLoan - principalPaid);
      } else if (year > loanDurationYears) {
        remainingLoan = 0;
      }

      // Calculate property value with appreciation
      const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
      
      // Calculate equity (property value - remaining loan)
      const totalEquity = propertyValue - remainingLoan;
      
      // Calculate total profit/loss
      const totalInvestment = equity + (monthlyPayment * 12 * Math.min(year, loanDurationYears));
      const netProfit = totalEquity - equity;

      data.push({
        year: year === 0 ? 'Nå' : `År ${year}`,
        propertyValue: Math.round(propertyValue),
        remainingLoan: Math.round(remainingLoan),
        equity: Math.round(totalEquity),
        netProfit: Math.round(netProfit),
        totalInvestment: Math.round(totalInvestment)
      });
    }
    
    return data;
  };

  const data = generateProfitabilityData();
  const currentEquity = purchasePrice - loanAmount;
  const projectedValue = currentValue || purchasePrice;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Lønnsomhetsanalyse over tid
        </CardTitle>
        <CardDescription>
          Beregnet prisvekst og egenkapitalutvikling basert på 3% årlig verdistigning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-primary-soft rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {Math.round(currentEquity).toLocaleString()} kr
            </div>
            <div className="text-sm text-muted-foreground">Nåværende egenkapital</div>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg">
            <div className="text-2xl font-bold text-accent">
              {Math.round(monthlyPayment).toLocaleString()} kr
            </div>
            <div className="text-sm text-muted-foreground">Månedlig avdrag</div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-secondary-foreground">
              {data[10]?.netProfit.toLocaleString()} kr
            </div>
            <div className="text-sm text-muted-foreground">Forventet gevinst (10 år)</div>
          </div>
        </div>

        <ChartContainer
          config={{
            propertyValue: {
              label: "Eiendomsverdi",
              color: "hsl(var(--primary))",
            },
            equity: {
              label: "Egenkapital", 
              color: "hsl(var(--accent))",
            },
            remainingLoan: {
              label: "Restgjeld",
              color: "hsl(var(--destructive))",
            },
          }}
          className="h-80"
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="propertyValue" 
              stroke="var(--color-propertyValue)"
              strokeWidth={3}
              dot={{ fill: "var(--color-propertyValue)", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="equity" 
              stroke="var(--color-equity)"
              strokeWidth={2}
              dot={{ fill: "var(--color-equity)", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="remainingLoan" 
              stroke="var(--color-remainingLoan)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "var(--color-remainingLoan)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};