import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const CalculatorPreview = () => {
  const [propertyValue, setPropertyValue] = useState("2500000");
  const [monthlyRent, setMonthlyRent] = useState("18000");
  const [monthlyExpenses, setMonthlyExpenses] = useState("3500");

  const grossYield = ((parseFloat(monthlyRent) * 12) / parseFloat(propertyValue)) * 100;
  const netYield = (((parseFloat(monthlyRent) - parseFloat(monthlyExpenses)) * 12) / parseFloat(propertyValue)) * 100;
  const monthlyCashFlow = parseFloat(monthlyRent) - parseFloat(monthlyExpenses);

  return (
    <section id="calculator" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Try Our
            <span className="text-primary block">Investment Calculator</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant analysis of your property investment potential. 
            See yields, cash flow, and returns in real-time.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  Enter your property information to calculate investment metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="property-value">Property Value (NOK)</Label>
                  <Input
                    id="property-value"
                    type="number"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-rent">Monthly Rent (NOK)</Label>
                  <Input
                    id="monthly-rent"
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly-expenses">Monthly Expenses (NOK)</Label>
                  <Input
                    id="monthly-expenses"
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Generate Full Report
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">Gross Yield</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {grossYield.toFixed(2)}%
                  </p>
                  <p className="text-muted-foreground">
                    Annual return before expenses
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-accent/20">
                <CardHeader>
                  <CardTitle className="text-accent">Net Yield</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent">
                    {netYield.toFixed(2)}%
                  </p>
                  <p className="text-muted-foreground">
                    Annual return after expenses
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Monthly Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {monthlyCashFlow.toLocaleString()} NOK
                  </p>
                  <p className="text-muted-foreground">
                    Net monthly income
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorPreview;