import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Download, Calculator } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const CallToAction = () => {
  const { translations } = useLanguage();
  const navigate = useNavigate();
  
  const handleDownloadExampleReport = () => {
    // Create example data that matches the report structure
    const exampleReportData = {
      basicData: {
        propertyValue: 4500000,
        monthlyRent: 25000,
        loanAmount: 3600000,
        expenses: 6500,
        monthlyLoanPayment: 20045,
        monthlyCashFlow: -1545, // 25000 - 6500 - 20045
        grossYield: 6.67, // (25000 * 12) / 4500000 * 100
        calculatorMode: 'investment',
        loanToValue: 80 // 3600000 / 4500000 * 100
      },
      profitabilityData: {
        score: 72,
        grossYield: 6.67,
        netYield: 4.89,
        totalMonthlyIncome: 25000,
        totalMonthlyExpenses: 6500,
        cashFlowAnalysis: 'Negativ cashflow på kort sikt, men god potensiell verdiøkning'
      },
      advancedData: {
        capRate: 4.89,
        cashOnCashReturn: -2.06,
        totalReturnPercentage: 2.83,
        netOperatingIncome: 222000, // (25000 - 6500) * 12
        annualAppreciation: 135000, // 3% av 4.5M
        effectiveMonthlyRent: 25000
      },
      marketData: {
        averageRentPsm: 294,
        marketGrowth: 3.2,
        localVacancyRate: 4.1,
        competitiveAnalysis: 'Konkurransedyktig pris i området'
      },
      riskData: {
        overallRisk: 'Middels',
        marketRisk: 'Lav',
        financialRisk: 'Middels',
        liquidityRisk: 'Lav',
        riskScore: 35
      },
      yieldData: {
        currentYield: 6.67,
        projectedYield: 7.2,
        annualizedReturn: 8.5,
        projectedRent: 32500
      },
      activatedModules: [
        'Lønnsomhetsanalyse',
        'Avanserte beregninger', 
        'Markedsanalyse',
        'Risikoevaluering',
        'Avkastningsanalyse'
      ]
    };

    // Navigate to bank report with example data
    navigate('/bank-report', { 
      state: exampleReportData
    });
  };
  
  return (
    <section className="py-12 lg:py-20 xl:py-32 bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-8 lg:p-12 shadow-large border-0 bg-card-elevated">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-4 lg:mb-6">
              {translations.cta.title}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground mb-6 lg:mb-8">
              {translations.cta.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-medium" asChild>
                <Link to="/auth">
                  <Calculator className="mr-2 h-5 w-5" />
                  {translations.cta.button}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="shadow-soft"
                onClick={handleDownloadExampleReport}
              >
                <Download className="mr-2 h-5 w-5" />
                Last ned eksempel rapport
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 justify-center items-center text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Ikke behov for kredittkort
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Øyeblikkelige beregninger
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                Profesjonelle PDF rapporter
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;