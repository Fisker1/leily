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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Se en ferdig analyserapport
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Her er et eksempel på hva du får når du bruker våre kalkulatorer og genererer en bankrapport.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-large mb-8">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Eiendomsanalyserapport</CardTitle>
              </div>
              <p className="text-muted-foreground">
                Profesjonell analyse av leilighet på Grünerløkka, Oslo
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <Badge variant="secondary">Lønnsomhetsanalyse</Badge>
                <Badge variant="secondary">Markedssammenligning</Badge>
                <Badge variant="secondary">Risikoevaluering</Badge>
                <Badge variant="secondary">Finansieringsscenarier</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Sample Content Preview */}
              <div className="bg-gradient-soft p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Sammendrag av analysen:</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong>Eiendom:</strong> 2-roms leilighet, 65 kvm, Grünerløkka Oslo - Kjøpesum: 2.5 mill kr
                  </p>
                  <p>
                    <strong>Finansiering:</strong> 20% egenkapital, 4.5% rente, månedlig betaling: 11,500 kr
                  </p>
                  <p>
                    <strong>Leieinntekt:</strong> 15,000 kr/mnd (over markedsgjennomsnitt på 14,500 kr)
                  </p>
                  <p>
                    <strong>Anbefaling:</strong> Vurder høyere egenkapital for positiv cash flow, ellers solid investering med god avkastning på lang sikt.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center pt-4">
                <Button 
                  onClick={handleViewExampleReport}
                  size="lg" 
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  Se full eksempelrapport
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Klikk for å se hvordan rapporten ser ut i sin helhet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ExampleReport;