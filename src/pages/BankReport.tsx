import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { 
  FileText, 
  Download, 
  Printer, 
  Building2,
  Calendar,
  TrendingUp,
  Shield,
  BarChart3,
  DollarSign,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModuleData {
  [key: string]: any;
}

const BankReport = () => {
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const reportData = location.state || {};
  const { user } = useAuth();
  
  const {
    basicData = {},
    profitabilityData = {},
    advancedData = {},
    marketData = {},
    riskData = {},
    yieldData = {},
    activatedModules = []
  } = reportData;

  const saveReportToDatabase = async (fileName: string, fileSize: number) => {
    if (!user) return;

    try {
      const reportRecord = {
        user_id: user.id,
        report_type: 'bank_report',
        property_data: {
          propertyValue: basicData.propertyValue,
          loanAmount: basicData.loanAmount,
          monthlyRent: basicData.monthlyRent,
          expenses: basicData.expenses,
          calculatorMode: basicData.calculatorMode
        },
        calculations: {
          monthlyCashFlow: basicData.monthlyCashFlow,
          grossYield: basicData.grossYield,
          profitabilityScore: profitabilityData.score,
          capRate: advancedData.capRate,
          activatedModules
        },
        file_name: fileName,
        file_size: fileSize
      };

      const { error } = await supabase
        .from('reports')
        .insert([reportRecord]);

      if (error) {
        console.error('Error saving report:', error);
        toast.error('Kunne ikke lagre rapport i systemet');
      } else {
        toast.success('Rapport lagret og sporet i systemet');
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      // Hide navigation temporarily
      const nav = document.querySelector('nav');
      const navDisplay = nav?.style.display;
      if (nav) nav.style.display = 'none';

      // Create canvas from the report
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });

      // Restore navigation
      if (nav && navDisplay) nav.style.display = navDisplay;

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const reportId = `AB-${Date.now().toString(36).toUpperCase()}`;
      const fileName = `bankrapport-${reportId}.pdf`;
      pdf.save(fileName);

      // Calculate approximate file size (PDF output as bytes)
      const pdfOutput = pdf.output('arraybuffer');
      const fileSize = pdfOutput.byteLength;

      // Save report tracking to database
      await saveReportToDatabase(fileName, fileSize);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const currentDate = new Date().toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            Tilbake til kalkulator
          </Link>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Skriv ut
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              Last ned PDF
            </Button>
          </div>
        </div>

        {/* Report Container */}
        <div ref={reportRef} className="max-w-4xl mx-auto bg-white text-black shadow-none overflow-hidden relative print:shadow-none">
          {/* Report Content */}
          <div className="relative z-20 p-8">
            {/* Professional Header */}
            <div className="mb-8 pb-6 border-b-2 border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-wide">APROPOS BOLIG AS</h1>
                  <p className="text-sm text-gray-700 mt-1">Autorisert eiendomsmegler & finansiell rådgiver</p>
                  <p className="text-xs text-gray-600 mt-1">Org.nr: 123 456 789 | REI-lisens: AB-2024</p>
                </div>
                <div className="text-right text-xs text-gray-700">
                  <p className="font-semibold">Rapport utstedt: {currentDate}</p>
                  <p>Referanse: AB-{Date.now().toString(36).toUpperCase()}</p>
                  <p>Konfidensialitet: Kun til bankformål</p>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">
                  EIENDOMSANALYSE FOR FINANSIERINGSFORMÅL
                </h2>
                <p className="text-sm text-gray-700 font-medium">
                  Utarbeidet i henhold til bankenes retningslinjer for investeringsevaluation
                </p>
              </div>
            </div>

            {/* Executive Summary */}
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                1. SAMMENDRAG AV ANALYSE
              </h3>
              
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Eiendomsdata</h4>
                  <table className="w-full text-xs">
                    <tbody className="space-y-1">
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Eiendomsverdi:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(basicData.propertyValue || 0)}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Lånebeløp:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency(basicData.loanAmount || 0)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-gray-600">Egenkapital:</td>
                        <td className="py-1 text-right font-semibold">{formatCurrency((basicData.propertyValue || 0) - (basicData.loanAmount || 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="border border-gray-300 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Nøkkeltall</h4>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Belåningsgrad:</td>
                        <td className="py-1 text-right font-semibold">
                          {formatPercent(((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-600">Månedlig cashflow:</td>
                        <td className={`py-1 text-right font-semibold ${(basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(basicData.monthlyCashFlow || 0)}
                        </td>
                      </tr>
                      {basicData.calculatorMode === 'investment' && (
                        <tr>
                          <td className="py-1 text-gray-600">Brutto yield:</td>
                          <td className="py-1 text-right font-semibold">
                            {formatPercent(basicData.grossYield || 0)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-gray-400 bg-gray-50 p-4">
                <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Anvendte analysemoduler</h4>
                <p className="text-xs text-gray-700 mb-2">
                  Rapporten baserer seg på følgende {activatedModules.length} analysemoduler:
                </p>
                <div className="flex flex-wrap gap-1">
                  {activatedModules.map((module: string) => (
                    <span key={module} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 border">
                      {module}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Profitability Analysis */}
            {activatedModules.includes('Lønnsomhetsanalyse') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  LØNNSOMHETSANALYSE
                </h3>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-primary/5 rounded-lg border">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {profitabilityData.score || 0}/100
                    </div>
                    <div className="text-sm text-gray-600">Lønnsomhetscore</div>
                  </div>
                  
                  {basicData.calculatorMode === 'investment' && (
                    <>
                      <div className="text-center p-4 bg-green-50 rounded-lg border">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatPercent(profitabilityData.grossYield || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Brutto yield</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {formatPercent(profitabilityData.netYield || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Netto yield</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-4">Månedlig økonomisk oversikt</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      {basicData.calculatorMode === 'investment' && (
                        <div className="flex justify-between">
                          <span>Leieinntekter:</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(basicData.monthlyRent || 0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Driftsutgifter:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(basicData.expenses || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lånebetalinger:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(basicData.monthlyLoanPayment || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="border-l pl-8">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Netto månedlig cashflow:</span>
                        <span className={`${(basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(basicData.monthlyCashFlow || 0) >= 0 ? '+' : ''}{formatCurrency(basicData.monthlyCashFlow || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Advanced Calculations */}
            {activatedModules.includes('Avanserte beregninger') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  AVANSERTE BEREGNINGER
                </h3>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Avkastningsmål</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Cap Rate:</span>
                        <span className="font-medium">{formatPercent(advancedData.capRate || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash-on-Cash avkastning:</span>
                        <span className="font-medium">{formatPercent(advancedData.cashOnCashReturn || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total avkastning:</span>
                        <span className="font-medium">{formatPercent(advancedData.totalReturnPercentage || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Økonomiske nøkkeltall</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>NOI (årlig):</span>
                        <span className="font-medium">{formatCurrency(advancedData.netOperatingIncome || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Årlig verdiøkning:</span>
                        <span className="font-medium">{formatCurrency(advancedData.annualAppreciation || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Effektiv månedlig leie:</span>
                        <span className="font-medium">{formatCurrency(advancedData.effectiveMonthlyRent || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Market Analysis */}
            {activatedModules.includes('Markedsanalyse') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  MARKEDSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">Prissammenligning</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Din eiendom:</span>
                        <span className="font-medium">{formatCurrency(marketData.propertyValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Områdesnitt:</span>
                        <span className="font-medium">{formatCurrency(marketData.averageAreaPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avvik:</span>
                        <span className={`font-medium ${(marketData.priceComparison || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {(marketData.priceComparison || 0) >= 0 ? '+' : ''}{formatPercent(marketData.priceComparison || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">Leiesammenligning</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Din leie:</span>
                        <span className="font-medium">{formatCurrency(marketData.monthlyRent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Områdesnitt:</span>
                        <span className="font-medium">{formatCurrency(marketData.averageAreaRent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avvik:</span>
                        <span className={`font-medium ${(marketData.rentComparison || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(marketData.rentComparison || 0) >= 0 ? '+' : ''}{formatPercent(marketData.rentComparison || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {formatPercent(marketData.rentYield || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Din brutto yield</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700 mb-1">
                        {formatPercent(marketData.marketRentYield || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Markedets yield</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Risk Evaluation */}
            {activatedModules.includes('Risikoevaluering') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  RISIKOEVALUERING
                </h3>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {formatPercent(riskData.loanToValue || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Belåningsgrad (LTV)</div>
                    <Badge 
                      variant={(riskData.loanToValue || 0) > 80 ? "destructive" : "default"} 
                      className="mt-2 text-xs"
                    >
                      {(riskData.loanToValue || 0) > 80 ? "Høy risiko" : "Akseptabel"}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-xl font-bold text-gray-700 mb-1">
                      {(riskData.debtServiceCoverage || 0).toFixed(1)}x
                    </div>
                    <div className="text-xs text-gray-600">Dekningsgrad</div>
                    <Badge 
                      variant={(riskData.debtServiceCoverage || 0) > 1.3 ? "default" : "destructive"} 
                      className="mt-2 text-xs"
                    >
                      {(riskData.debtServiceCoverage || 0) > 1.3 ? "Trygg" : "Risiko"}
                    </Badge>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className={`text-xl font-bold mb-1 ${(riskData.cashFlowBuffer || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(riskData.cashFlowBuffer || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Cashflow-buffer</div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-4">Risikoscenarier</h4>
                  <div className="space-y-3 text-sm">
                    {riskData.scenarios && riskData.scenarios.map((scenario: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{scenario.title}:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${scenario.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {scenario.impact >= 0 ? '+' : ''}{formatCurrency(scenario.impact)}
                          </span>
                          <Badge 
                            variant={scenario.severity === 'Høy' ? 'destructive' : scenario.severity === 'Moderat' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {scenario.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Yield Analysis */}
            {activatedModules.includes('Avkastningsanalyse') && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  AVKASTNINGSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">Nåværende avkastning</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Brutto årlig yield:</span>
                        <span className="font-medium">{formatPercent(yieldData.grossYield || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Netto årlig yield:</span>
                        <span className="font-medium">{formatPercent(yieldData.netYield || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Månedlig netto:</span>
                        <span className="font-medium">{formatCurrency(yieldData.monthlyNet || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Fremskrivning ({yieldData.projectionYears || 10} år)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Forventet eiendomsverdi:</span>
                        <span className="font-medium">{formatCurrency(yieldData.projectedValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Forventet månedlig leie:</span>
                        <span className="font-medium">{formatCurrency(yieldData.projectedRent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annualisert avkastning:</span>
                        <span className="font-medium text-primary">{formatPercent(yieldData.annualizedReturn || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Conclusion */}
            <section className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                {activatedModules.length + 1}. KONKLUSJON OG ANBEFALINGER
              </h3>
              
              <div className="border border-gray-400 bg-gray-50 p-4 mb-4">
                <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Samlet vurdering</h4>
                <p className="text-xs text-gray-800 leading-relaxed">
                  Basert på gjennomført analyse viser eiendommen {' '}
                  {(basicData.monthlyCashFlow || 0) >= 0 ? 'positiv' : 'negativ'} månedlig cashflow på {' '}
                  {formatCurrency(Math.abs(basicData.monthlyCashFlow || 0))}. 
                  {basicData.calculatorMode === 'investment' && ` Brutto yield på ${formatPercent(basicData.grossYield || 0)} 
                  indikerer ${(basicData.grossYield || 0) > 6 ? 'attraktiv' : 'moderat'} avkastning sammenlignet med markedssnitt.`}
                  {' '}Belåningsgraden på {formatPercent(((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100)} 
                  er {((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100 < 80 ? 'innenfor' : 'over'} normale bankkrav.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-green-400 bg-green-50 p-3">
                  <h5 className="font-bold text-green-800 mb-2 text-xs uppercase">Styrker ved investeringen:</h5>
                  <ul className="text-xs text-gray-800 space-y-1">
                    {(basicData.loanToValue || 0) < 80 && <li>• Konservativ belåningsgrad under 80%</li>}
                    {(basicData.monthlyCashFlow || 0) > 0 && <li>• Selvfinansierende investering (positiv cashflow)</li>}
                    {(basicData.grossYield || 0) > 6 && <li>• Yield over markedsgjennomsnitt</li>}
                    <li>• Omfattende analyse og dokumentasjon</li>
                    <li>• Transparent økonomisk fremstilling</li>
                  </ul>
                </div>

                <div className="border border-yellow-400 bg-yellow-50 p-3">
                  <h5 className="font-bold text-yellow-800 mb-2 text-xs uppercase">Risikomomenter å vurdere:</h5>
                  <ul className="text-xs text-gray-800 space-y-1">
                    {(basicData.loanToValue || 0) > 80 && <li>• Høy belåningsgrad - egenkapitalkrav</li>}
                    {(basicData.monthlyCashFlow || 0) < 0 && <li>• Månedlig tilskudd nødvendig</li>}
                    <li>• Rentefølsomhet ved endringer</li>
                    <li>• Markedsrisiko og konjunktursvingninger</li>
                    <li>• Leieledie og vedlikeholdskostnader</li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-400 bg-white p-4 mt-4">
                <h5 className="font-bold text-gray-800 mb-2 text-xs uppercase">Bankens vurdering:</h5>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Investeringen {(basicData.monthlyCashFlow || 0) >= 0 && ((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100 < 80 ? 
                  'fremstår som solid med god sikkerhet for utlån' : 
                  'krever nærmere vurdering av kredittrisiko'}. 
                  Dokumentasjonen er omfattende og gir et godt grunnlag for lånevurdering.
                </p>
              </div>
            </section>

            {/* Professional Footer */}
            <div className="border-t-2 border-gray-800 pt-4 mt-8">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-bold text-gray-900 text-base tracking-wide">APROPOS BOLIG AS</h4>
                  <p className="text-xs text-gray-600">Autorisert eiendomsmegler og finansiell rådgiver</p>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p>Kontakt: post@aproposbolig.no | Tlf: +47 XX XX XX XX</p>
                    <p>Organisasjonsnummer: 123 456 789 MVA | REI-lisens: AB-2024</p>
                    <p className="font-medium">
                      Denne rapporten er utarbeidet som grunnlag for finansieringsvurdering og er konfidensielt.
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div className="border border-gray-300 p-2 bg-gray-50">
                    <p className="font-semibold">Dokument-ID:</p>
                    <p>AB-{Date.now().toString(36).toUpperCase()}</p>
                    <p className="mt-1 text-gray-600">Generert: {currentDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReport;