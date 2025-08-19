import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useState } from "react";

interface YieldCalculatorsProps {
  propertyValue: number;
  monthlyRent: number;
  expenses: number;
}

const YieldCalculators = ({ propertyValue, monthlyRent, expenses }: YieldCalculatorsProps) => {
  const [projectedRentIncrease, setProjectedRentIncrease] = useState("3");
  const [projectedValueIncrease, setProjectedValueIncrease] = useState("4");
  const [analysisYears, setAnalysisYears] = useState("10");

  // Current yields
  const grossMonthlyYield = ((monthlyRent * 12) / propertyValue) * 100;
  const netMonthlyYield = (((monthlyRent - expenses) * 12) / propertyValue) * 100;
  
  // Projected calculations
  const years = parseInt(analysisYears);
  const rentGrowthRate = parseFloat(projectedRentIncrease) / 100;
  const valueGrowthRate = parseFloat(projectedValueIncrease) / 100;
  
  const projectedMonthlyRent = monthlyRent * Math.pow(1 + rentGrowthRate, years);
  const projectedPropertyValue = propertyValue * Math.pow(1 + valueGrowthRate, years);
  
  const futureGrossYield = ((projectedMonthlyRent * 12) / projectedPropertyValue) * 100;
  const futureNetYield = (((projectedMonthlyRent - expenses) * 12) / projectedPropertyValue) * 100;

  // Compound annual growth calculations
  const totalRentIncome = Array.from({ length: years }, (_, i) => {
    const yearRent = monthlyRent * Math.pow(1 + rentGrowthRate, i + 1) * 12;
    return yearRent - (expenses * 12);
  }).reduce((sum, income) => sum + income, 0);

  const totalReturn = totalRentIncome + (projectedPropertyValue - propertyValue);
  const annualizedReturn = (Math.pow(totalReturn / propertyValue + 1, 1 / years) - 1) * 100;

  // Monthly breakdown for current year
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleString('no-NO', { month: 'short' }),
    rent: monthlyRent,
    expenses: expenses,
    net: monthlyRent - expenses,
    yield: (((monthlyRent - expenses) * 12) / propertyValue) * 100
  }));

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Avkastningskalkulatorer
          </CardTitle>
          <CardDescription>
            Detaljert analyse av månedlig og årlig avkastning over tid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">Månedlig</TabsTrigger>
              <TabsTrigger value="annual">Årlig</TabsTrigger>
              <TabsTrigger value="projection">Projeksjon</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary-soft rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Brutto månedlig yield</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{(grossMonthlyYield / 12).toFixed(3)}%</p>
                  <p className="text-xs text-muted-foreground">per måned</p>
                </div>
                
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Netto månedlig yield</p>
                  </div>
                  <p className="text-2xl font-bold text-accent">{(netMonthlyYield / 12).toFixed(3)}%</p>
                  <p className="text-xs text-muted-foreground">per måned</p>
                </div>

                <div className="text-center p-4 bg-card-elevated rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-foreground" />
                    <p className="text-sm text-muted-foreground">Månedlig netto</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{(monthlyRent - expenses).toLocaleString()} kr</p>
                  <p className="text-xs text-muted-foreground">kontantstrøm</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Månedlig oversikt (2024)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {monthlyBreakdown.map((month, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-center mb-1">{month.month}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Leie:</span>
                          <span className="text-primary">{month.rent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Utgifter:</span>
                          <span className="text-destructive">-{month.expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Netto:</span>
                          <span className="text-primary">{month.net.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="annual" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gradient-primary text-primary-foreground rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Brutto årlig yield</h3>
                  <p className="text-4xl font-bold">{grossMonthlyYield.toFixed(2)}%</p>
                  <p className="text-sm opacity-90">Årlig avkastning før utgifter</p>
                  <div className="mt-3 pt-3 border-t border-primary-foreground/20">
                    <p className="text-sm">Årlig leieinntekt: {(monthlyRent * 12).toLocaleString()} kr</p>
                  </div>
                </div>

                <div className="text-center p-6 bg-accent text-accent-foreground rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Netto årlig yield</h3>
                  <p className="text-4xl font-bold">{netMonthlyYield.toFixed(2)}%</p>
                  <p className="text-sm opacity-90">Årlig avkastning etter utgifter</p>
                  <div className="mt-3 pt-3 border-t border-accent-foreground/20">
                    <p className="text-sm">Årlig netto: {((monthlyRent - expenses) * 12).toLocaleString()} kr</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-card-elevated rounded-lg">
                  <p className="text-sm text-muted-foreground">Årlige leieinntekter</p>
                  <p className="text-xl font-bold text-primary">{(monthlyRent * 12).toLocaleString()} kr</p>
                </div>
                <div className="p-4 bg-card-elevated rounded-lg">
                  <p className="text-sm text-muted-foreground">Årlige utgifter</p>
                  <p className="text-xl font-bold text-destructive">{(expenses * 12).toLocaleString()} kr</p>
                </div>
                <div className="p-4 bg-card-elevated rounded-lg">
                  <p className="text-sm text-muted-foreground">Årlig netto cashflow</p>
                  <p className="text-xl font-bold text-accent">{((monthlyRent - expenses) * 12).toLocaleString()} kr</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projection" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rent-increase">Årlig leieøkning (%)</Label>
                  <Input
                    id="rent-increase"
                    type="number"
                    step="0.1"
                    value={projectedRentIncrease}
                    onChange={(e) => setProjectedRentIncrease(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="value-increase">Årlig verdiøkning (%)</Label>
                  <Input
                    id="value-increase"
                    type="number"
                    step="0.1"
                    value={projectedValueIncrease}
                    onChange={(e) => setProjectedValueIncrease(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="analysis-years">Analyseperiode (år)</Label>
                  <Input
                    id="analysis-years"
                    type="number"
                    value={analysisYears}
                    onChange={(e) => setAnalysisYears(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Dagens verdier</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eiendomsverdi:</span>
                      <span className="font-semibold">{propertyValue.toLocaleString()} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Månedlig leie:</span>
                      <span className="font-semibold">{monthlyRent.toLocaleString()} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Årlig yield:</span>
                      <span className="font-semibold text-primary">{netMonthlyYield.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Om {years} år</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eiendomsverdi:</span>
                      <span className="font-semibold">{projectedPropertyValue.toLocaleString()} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Månedlig leie:</span>
                      <span className="font-semibold">{projectedMonthlyRent.toLocaleString()} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Årlig yield:</span>
                      <span className="font-semibold text-accent">{futureNetYield.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-soft rounded-lg border">
                <h4 className="text-lg font-semibold text-foreground mb-2">Total avkastning</h4>
                <p className="text-3xl font-bold text-primary">{annualizedReturn.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">Årlig gjennomsnittlig avkastning over {years} år</p>
                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total leieinntekt:</span>
                    <span className="font-semibold">{totalRentIncome.toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kapitalgevinst:</span>
                    <span className="font-semibold">{(projectedPropertyValue - propertyValue).toLocaleString()} kr</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total avkastning:</span>
                    <span className="text-primary">{totalReturn.toLocaleString()} kr</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default YieldCalculators;