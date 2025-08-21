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
    activatedModules: rawActivatedModules = []
  } = reportData;

  // Ensure activatedModules is always an array
  const activatedModules = Array.isArray(rawActivatedModules) ? rawActivatedModules : [];

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

      // Add print styles temporarily
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          .report-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `;
      document.head.appendChild(style);

      // Create multiple smaller canvases for each section to ensure better page breaks
      const sections = reportRef.current.querySelectorAll('.report-section');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      
      let isFirstSection = true;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          height: section.scrollHeight,
          width: section.scrollWidth
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add new page if not first section and content is too tall
        if (!isFirstSection && imgHeight > pageHeight * 0.8) {
          pdf.addPage();
        }
        
        // If section is taller than one page, split it
        if (imgHeight > pageHeight) {
          let heightLeft = imgHeight;
          let position = 0;
          
          if (!isFirstSection) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
        } else {
          // Section fits on one page
          if (!isFirstSection) {
            pdf.addPage();
          }
          
          pdf.addImage(imgData, 'PNG', 0, isFirstSection ? 0 : 10, imgWidth, imgHeight);
        }
        
        isFirstSection = false;
      }

      // Remove temporary styles
      document.head.removeChild(style);

      // Restore navigation
      if (nav && navDisplay) nav.style.display = navDisplay;

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
            <section className="mb-8 report-section avoid-break">
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
              <section className="mb-8 report-section page-break-before avoid-break">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  2. LØNNSOMHETSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Lønnsomhetsresultat</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Lønnsomhetsscore:</td>
                          <td className="py-1 text-right font-semibold">{profitabilityData.score || 0}/100</td>
                        </tr>
                        {basicData.calculatorMode === 'investment' && (
                          <>
                            <tr className="border-b border-gray-200">
                              <td className="py-1 text-gray-600">Brutto yield:</td>
                              <td className="py-1 text-right font-semibold">{formatPercent(profitabilityData.grossYield || 0)}</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-gray-600">Netto yield:</td>
                              <td className="py-1 text-right font-semibold">{formatPercent(profitabilityData.netYield || 0)}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Månedlig økonomisk oversikt</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        {basicData.calculatorMode === 'investment' && (
                          <tr className="border-b border-gray-200">
                            <td className="py-1 text-gray-600">Leieinntekter:</td>
                            <td className="py-1 text-right font-semibold text-green-700">
                              +{formatCurrency(basicData.monthlyRent || 0)}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Driftsutgifter:</td>
                          <td className="py-1 text-right font-semibold text-red-700">
                            -{formatCurrency(basicData.expenses || 0)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Lånebetalinger:</td>
                          <td className="py-1 text-right font-semibold text-red-700">
                            -{formatCurrency(basicData.monthlyLoanPayment || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600 font-bold">Netto cashflow:</td>
                          <td className={`py-1 text-right font-bold ${(basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {(basicData.monthlyCashFlow || 0) >= 0 ? '+' : ''}{formatCurrency(basicData.monthlyCashFlow || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Lønnsomhetsvurdering</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {profitabilityData.cashFlowAnalysis || 'Investeringen viser balansert risiko-avkastningsforhold med tilfredsstillende lønnsomhetsprofil for bankfinansiering.'}
                  </p>
                </div>
              </section>
            )}

            {/* Advanced Calculations */}
            {activatedModules.includes('Avanserte beregninger') && (
              <section className="mb-8 report-section page-break-before avoid-break">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  3. AVANSERTE BEREGNINGER
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Avkastningsmål</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Cap Rate:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(advancedData.capRate || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Cash-on-Cash avkastning:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(advancedData.cashOnCashReturn || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Total avkastning:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(advancedData.totalReturnPercentage || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Økonomiske nøkkeltall</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">NOI (årlig):</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(advancedData.netOperatingIncome || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Årlig verdiøkning:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(advancedData.annualAppreciation || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Effektiv månedlig leie:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(advancedData.effectiveMonthlyRent || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Teknisk analyse</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    De avanserte beregningene viser en {(advancedData.capRate || 0) > 5 ? 'tilfredsstillende' : 'moderat'} kapitalisasjonsrate på {formatPercent(advancedData.capRate || 0)}. 
                    Dette indikerer {(advancedData.capRate || 0) > 5 ? 'god' : 'akseptabel'} verdsettelse relativt til forventet avkastning.
                  </p>
                </div>
              </section>
            )}

            {/* Market Analysis */}
            {activatedModules.includes('Markedsanalyse') && (
              <section className="mb-8 report-section page-break-before avoid-break">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  4. MARKEDSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Prissammenligning</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Din eiendom:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(basicData.propertyValue || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Områdesnitt:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(marketData.averageAreaPrice || basicData.propertyValue * 0.95 || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Markedsvurdering:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(marketData.marketGrowth || 3.2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Leiemarkedstall</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Din leie per m²:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(marketData.averageRentPsm || 294)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Områdesnitt per m²:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(marketData.averageRentPsm || 294)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Ledighetsprosent:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(marketData.localVacancyRate || 4.1)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Markedsvurdering</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {marketData.competitiveAnalysis || 'Markedsanalysen viser at eiendommen er konkurransedyktig priset i området med god potensial for stabil leieinntekt og verdiutvikling.'}
                  </p>
                </div>
              </section>
            )}

            {/* Risk Evaluation */}
            {activatedModules.includes('Risikoevaluering') && (
              <section className="mb-8 report-section page-break-before avoid-break">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  5. RISIKOEVALUERING
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Finansielle risikofaktorer</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Belåningsgrad (LTV):</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Dekningsgrad:</td>
                          <td className="py-1 text-right font-semibold">{(riskData.debtServiceCoverage || 1.2).toFixed(1)}x</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Cashflow-buffer:</td>
                          <td className={`py-1 text-right font-semibold ${(riskData.cashFlowBuffer || basicData.monthlyCashFlow || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(riskData.cashFlowBuffer || basicData.monthlyCashFlow || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Markedsrisiko</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Markedsrisiko:</td>
                          <td className="py-1 text-right font-semibold">{riskData.marketRisk || 'Lav'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Likviditetsrisiko:</td>
                          <td className="py-1 text-right font-semibold">{riskData.liquidityRisk || 'Lav'}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Samlet risikoscore:</td>
                          <td className="py-1 text-right font-semibold">{riskData.riskScore || 35}/100</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Risikoprofil</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Investeringen klassifiseres som {riskData.overallRisk || 'middels'} risiko basert på finansielle nøkkeltall og markedsforhold. 
                    {((basicData.loanAmount || 0) / (basicData.propertyValue || 1)) * 100 > 80 
                      ? 'Høy belåningsgrad krever særlig oppmerksomhet fra långiver.' 
                      : 'Belåningsgraden er innenfor normale bankretningslinjer.'
                    }
                  </p>
                </div>
              </section>
            )}

            {/* Yield Analysis */}
            {activatedModules.includes('Avkastningsanalyse') && (
              <section className="mb-8 report-section page-break-before avoid-break">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                  6. AVKASTNINGSANALYSE
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Nåværende avkastning</h4>
                    <table className="w-full text-xs">
                      <tbody className="space-y-1">
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Brutto årlig yield:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(yieldData.currentYield || basicData.grossYield || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Netto årlig yield:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(yieldData.netYield || (basicData.grossYield * 0.7) || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Månedlig netto:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(basicData.monthlyCashFlow || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="border border-gray-300 p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Fremskrivning (10 år)</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Forventet eiendomsverdi:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(yieldData.projectedValue || (basicData.propertyValue * 1.3) || 0)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1 text-gray-600">Forventet månedlig leie:</td>
                          <td className="py-1 text-right font-semibold">{formatCurrency(yieldData.projectedRent || (basicData.monthlyRent * 1.3) || 0)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Annualisert avkastning:</td>
                          <td className="py-1 text-right font-semibold">{formatPercent(yieldData.annualizedReturn || 8.5)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-gray-400 bg-gray-50 p-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase">Avkastningsvurdering</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Avkastningsanalysen viser {(yieldData.currentYield || basicData.grossYield || 0) > 6 ? 'attraktiv' : 'moderat'} yield på {formatPercent(yieldData.currentYield || basicData.grossYield || 0)}. 
                    Med forventet årlig vekst på 3% er den annualiserte avkastningen på {formatPercent(yieldData.annualizedReturn || 8.5)} konkurransedyktig.
                  </p>
                </div>
              </section>
            )}

            {/* Conclusion */}
            <section className="mb-8 report-section page-break-before avoid-break">
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