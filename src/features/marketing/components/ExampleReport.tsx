import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, PieChart, AlertTriangle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExampleReport = () => {
  const navigate = useNavigate();

  const handleViewExampleReport = () => {
    // Example report data that matches the BankReport structure
    const exampleReportData = {
      basicData: {
        propertyType: "leilighet",
        propertyValue: 2500000,
        equity: 500000,
        loanAmount: 2000000,
        interestRate: 4.5,
        loanPeriod: 25,
        monthlyRent: 15000,
        expenses: 5000,
        municipalFees: 1500,
        electricityMonthly: 1000,
        insurance: 800,
        sharedExpenses: 1700,
        monthlyLoanPayment: 11500,
        monthlyCashFlow: -1500,
        grossYield: 7.2,
        calculatorMode: "investment"
      },
      profitabilityData: {
        score: 75,
        monthlyReturn: -1.2,
        annualReturn: 6.8
      },
      advancedData: {
        capRate: 6.5,
        totalYield: 7.2,
        paybackPeriod: 18.5
      },
      marketData: {
        averageRent: 14500,
        pricePerSqm: 85000,
        rentYield: 6.5,
        marketGrowth: 4.2
      },
      riskData: {
        riskFactors: [
          "Negativ månedlig cash flow første år",
          "Høy belåningsgrad (80%)",
          "Lav leiedekning i området"
        ]
      },
      yieldData: {
        recommendations: [
          "Vurder høyere egenkapitalandel for bedre cash flow",
          "Undersøk muligheter for økt leieinntekt",
          "Beregn med fremtidig rentestigning"
        ]
      },
      activatedModules: ["basic", "profitability", "advanced", "market", "risk", "yield"]
    };

    navigate('/bank-report', { state: exampleReportData });
  };

  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
            Se en ferdig analyserapport
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
            Se hvordan en komplett eiendomsanalyse ser ut med våre kalkulatorer.
          </p>
          
          <Button 
            onClick={handleViewExampleReport}
            size="lg" 
            className="gap-2 w-full sm:w-auto"
          >
            <Download className="h-5 w-5" />
            Se full eksempelrapport
          </Button>
          <p className="text-sm text-muted-foreground mt-3 sm:mt-4">
            Klikk for å se hvordan rapporten ser ut i sin helhet
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExampleReport;